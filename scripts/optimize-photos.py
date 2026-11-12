"""Generate responsive WebP copies with Chrome/Edge's native image encoder.

Run: py -X utf8 scripts/optimize-photos.py
Requires Python 3.8+ and Chrome or Edge; no Python imaging packages are needed.
Original photographs are read only. The site needs no server or build step.
"""

import base64
import functools
import hashlib
import http.server
import json
import os
from pathlib import Path
import shutil
import socket
import struct
import subprocess
import tempfile
import threading
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'images' / 'photography' / 'web'
MANIFEST = ROOT / 'data' / 'photo-variants.js'
ENCODER_VERSION = 1

ENCODER_PAGE = b'''<!doctype html><meta charset="utf-8"><title>Local photo encoder</title>
<script>
window.encodePhoto = async function(src) {
    const image = new Image();
    image.src = '/' + src.split('/').map(encodeURIComponent).join('/');
    await image.decode();
    const width = image.naturalWidth, height = image.naturalHeight;
    const variants = [];
    for (const [limit, quality] of [[480, .8], [960, .82], [1920, .88]]) {
        const w = Math.min(width, limit), h = Math.round(height * w / width);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const context = canvas.getContext('2d');
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, w, h);
        const encoded = canvas.toDataURL('image/webp', quality);
        if (!encoded.startsWith('data:image/webp;base64,')) throw Error('WebP encoding unavailable');
        variants.push({limit, width: w, height: h, encoded: encoded.split(',')[1]});
        canvas.width = canvas.height = 0;
    }
    return {width, height, variants};
};
</script>'''


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/__photo_encoder__':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(ENCODER_PAGE)
        else:
            super().do_GET()

    def log_message(self, *args):
        pass


class DevTools:
    """Minimal local DevTools transport using the Python standard library."""
    def __init__(self, address):
        url = urllib.parse.urlsplit(address)
        self.socket = socket.create_connection((url.hostname, url.port), timeout=90)
        self.sequence = 0
        key = base64.b64encode(os.urandom(16)).decode()
        handshake = ('GET ' + url.path + ' HTTP/1.1\r\nHost: localhost\r\n'
                     'Upgrade: websocket\r\nConnection: Upgrade\r\n'
                     'Sec-WebSocket-Key: ' + key + '\r\nSec-WebSocket-Version: 13\r\n\r\n')
        self.socket.sendall(handshake.encode())
        header = b''
        while b'\r\n\r\n' not in header:
            header += self.read(1)
        if not header.startswith(b'HTTP/1.1 101 '):
            raise RuntimeError('Browser WebSocket handshake failed')

    def read(self, length):
        chunks = bytearray()
        while len(chunks) < length:
            chunk = self.socket.recv(length - len(chunks))
            if not chunk:
                raise EOFError('Browser disconnected')
            chunks.extend(chunk)
        return bytes(chunks)

    def send(self, payload, opcode=1):
        size = len(payload)
        header = bytes([0x80 | opcode])
        if size < 126:
            header += bytes([0x80 | size])
        elif size < 65536:
            header += bytes([0xfe]) + struct.pack('!H', size)
        else:
            header += bytes([0xff]) + struct.pack('!Q', size)
        mask = os.urandom(4)
        masked = bytes(value ^ mask[index % 4] for index, value in enumerate(payload))
        self.socket.sendall(header + mask + masked)

    def receive(self):
        message = bytearray()
        while True:
            first, second = self.read(2)
            size = second & 127
            if size == 126:
                size = struct.unpack('!H', self.read(2))[0]
            elif size == 127:
                size = struct.unpack('!Q', self.read(8))[0]
            payload = self.read(size)
            opcode = first & 15
            if opcode == 8:
                raise EOFError('Browser closed the connection')
            if opcode == 9:
                self.send(payload, opcode=10)
                continue
            if opcode in (0, 1):
                message.extend(payload)
                if first & 128:
                    return json.loads(message)

    def call(self, method, params=None):
        self.sequence += 1
        self.send(json.dumps({'id': self.sequence, 'method': method, 'params': params or {}}).encode())
        while True:
            response = self.receive()
            if response.get('id') == self.sequence:
                if 'error' in response:
                    raise RuntimeError(response['error'])
                return response.get('result', {})

    def evaluate(self, expression):
        result = self.call('Runtime.evaluate', {'expression': expression, 'awaitPromise': True, 'returnByValue': True})
        if 'exceptionDetails' in result:
            raise RuntimeError(result['exceptionDetails'])
        return result.get('result', {}).get('value')


def find_browser():
    candidates = [shutil.which(name) for name in ['google-chrome', 'chromium', 'chromium-browser', 'msedge']]
    for base in ['PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA']:
        folder = os.environ.get(base)
        if folder:
            candidates.extend([str(Path(folder) / 'Google/Chrome/Application/chrome.exe'),
                               str(Path(folder) / 'Microsoft/Edge/Application/msedge.exe')])
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return candidate
    raise RuntimeError('Install Chrome or Edge to generate the web copies.')


def main():
    catalogue = json.loads((ROOT / 'photo-data.js').read_text(encoding='utf-8').split('window.PHOTO_DATA = ', 1)[1].strip().rstrip(';'))
    previous = {}
    if MANIFEST.exists():
        previous = json.loads(MANIFEST.read_text(encoding='utf-8').split('window.PHOTO_VARIANTS = ', 1)[1].strip().rstrip(';'))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    handler = functools.partial(Handler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    manifest = {}
    browser = None
    try:
        with tempfile.TemporaryDirectory(prefix='photo-encoder-') as profile:
            args = [find_browser(), '--headless', '--disable-gpu', '--no-first-run',
                    '--no-default-browser-check', '--remote-debugging-port=0',
                    '--user-data-dir=' + profile, 'about:blank']
            options = {'creationflags': subprocess.CREATE_NO_WINDOW} if os.name == 'nt' else {}
            browser = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, **options)
            port_file = Path(profile) / 'DevToolsActivePort'
            for _ in range(150):
                if port_file.exists():
                    break
                if browser.poll() is not None:
                    raise RuntimeError('The browser could not start')
                time.sleep(.1)
            port = int(port_file.read_text().splitlines()[0])
            tabs = json.load(urllib.request.urlopen('http://127.0.0.1:' + str(port) + '/json'))
            client = DevTools(next(tab['webSocketDebuggerUrl'] for tab in tabs if tab['type'] == 'page'))
            client.call('Page.navigate', {'url': 'http://127.0.0.1:' + str(server.server_port) + '/__photo_encoder__'})
            for _ in range(100):
                if client.evaluate('typeof window.encodePhoto === "function"'):
                    break
                time.sleep(.1)
            for photo in catalogue['photos']:
                source = (ROOT / photo['src']).resolve()
                source.relative_to(ROOT)
                fingerprint = hashlib.sha256(source.read_bytes()).hexdigest()
                cached = previous.get(photo['id'], {})
                files = cached.get('previews', []) + [cached.get('large', {})]
                if cached.get('original') == photo['src'] and cached.get('sourceHash') == fingerprint and cached.get('encoderVersion') == ENCODER_VERSION and all(
                        entry.get('src') and (ROOT / entry['src']).is_file() for entry in files):
                    manifest[photo['id']] = cached
                    print(photo['id'] + ': unchanged', flush=True)
                    continue
                result = client.evaluate('window.encodePhoto(' + json.dumps(photo['src']) + ')')
                record = {'original': photo['src'], 'sourceHash': fingerprint, 'encoderVersion': ENCODER_VERSION,
                          'width': result['width'], 'height': result['height'], 'previews': []}
                for variant in result['variants']:
                    output = OUTPUT / (photo['id'] + '-' + str(variant['limit']) + '.webp')
                    payload = base64.b64decode(variant['encoded'])
                    output.write_bytes(payload)
                    entry = {'src': output.relative_to(ROOT).as_posix(), 'width': variant['width'], 'height': variant['height']}
                    if variant['limit'] == 1920:
                        record['large'] = entry
                    elif not any(v['width'] == entry['width'] for v in record['previews']):
                        record['previews'].append(entry)
                manifest[photo['id']] = record
                preview_bytes = (ROOT / record['previews'][-1]['src']).stat().st_size
                print(photo['id'] + ': 960px preview ' + str(round(preview_bytes / 1024)) + ' KB', flush=True)
            MANIFEST.write_text('// Generated by scripts/optimize-photos.py; do not edit by hand.\nwindow.PHOTO_VARIANTS = '
                                + json.dumps(manifest, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
            client.call('Browser.close')
            client.socket.close()
            browser.wait(timeout=10)
    finally:
        if browser and browser.poll() is None:
            browser.terminate()
            browser.wait(timeout=10)
        server.shutdown()
        server.server_close()
    original_bytes = sum((ROOT / photo['src']).stat().st_size for photo in catalogue['photos'])
    preview_bytes = sum((ROOT / entry['previews'][-1]['src']).stat().st_size for entry in manifest.values())
    print('Originals: %.2f MB; 960px previews: %.2f MB; reduction: %.1f%%' %
          (original_bytes / 1024**2, preview_bytes / 1024**2, (1 - preview_bytes / original_bytes) * 100), flush=True)


if __name__ == '__main__':
    main()
