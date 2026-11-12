/* A dependency-free, orthographic 3D globe. All geometry and assets are local. */
class TravelGlobe {
    constructor(canvas, pinLayer, locations, onSelect, onStateChange) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pinLayer = pinLayer;
        this.locations = locations;
        this.onSelect = onSelect;
        this.onStateChange = onStateChange;
        this.motion = matchMedia('(prefers-reduced-motion: reduce)');
        this.yaw = -0.55;
        this.pitch = 0.12;
        this.zoom = 1;
        this.minZoom = .75;
        this.maxZoom = 1.35;
        this.rotating = !this.motion.matches;
        this.rotationEnabled = this.rotating;
        this.resumeTimer = null;
        this.resumeDelay = 1500;
        this.pointerInput = false;
        this.visible = false;
        this.focused = false;
        this.frame = null;
        this.lastTime = 0;
        this.target = null;
        this.drag = null;
        this.selectedId = null;

        const geometry = window.TRAVEL_GEOGRAPHY || { coastlines: [], borders: [], landPoints: [] };
        this.coasts = geometry.coastlines.map((line) => line.map(([lon, lat]) => this.vector(lat, lon)));
        this.borders = geometry.borders.map((line) => line.map(([lon, lat]) => this.vector(lat, lon)));
        this.land = geometry.landPoints.map(([lon, lat]) => this.vector(lat, lon));
        this.grid = [];
        for (let lat = -60; lat <= 60; lat += 15) {
            this.grid.push(Array.from({ length: 181 }, (_, i) => this.vector(lat, i * 2 - 180)));
        }
        for (let lon = -180; lon < 180; lon += 15) {
            this.grid.push(Array.from({ length: 91 }, (_, i) => this.vector(i * 2 - 90, lon)));
        }
        this.stars = Array.from({ length: 125 }, (_, i) => ({
            x: this.random(i + 1), y: this.random(i + 501), r: .4 + this.random(i + 901) * 1.1,
        }));
        this.setLocations(locations);

        if (!this.ctx) {
            canvas.hidden = true;
            this.rotating = false;
            this.rotationEnabled = false;
            onStateChange(this);
            return;
        }
        this.bindControls();
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(canvas);
        this.visibilityObserver = new IntersectionObserver(([entry]) => {
            this.visible = entry.isIntersecting;
            if (this.visible) {
                this.requestDraw();
                this.scheduleResume();
            } else {
                this.clearResumeTimer();
                this.stopFrame();
            }
        }, { rootMargin: '100px' });
        this.visibilityObserver.observe(canvas);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.clearResumeTimer();
                this.stopFrame();
            } else {
                this.requestDraw();
                this.scheduleResume();
            }
        });
        this.motion.addEventListener('change', () => {
            if (this.motion.matches) {
                this.rotating = false;
                this.rotationEnabled = false;
                this.clearResumeTimer();
                if (this.target) {
                    this.yaw = this.target.yaw;
                    this.pitch = this.target.pitch;
                    this.zoom = this.target.zoom;
                }
            }
            this.target = null;
            onStateChange(this);
            this.requestDraw();
        });
        this.resize();
        onStateChange(this);
    }

    setLocations(locations) {
        this.clearResumeTimer();
        this.locations = locations;
        this.selectedId = null;
        this.pinLayer.replaceChildren();
        this.pins = locations.map((location) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'globe-pin';
            button.hidden = true;
            button.dataset.pin = location.id;
            button.dataset.kind = location.kind || 'destination';
            button.setAttribute('aria-label', location.kind === 'country'
                ? `Zoom into ${location.name} to explore destinations`
                : `Explore photographs from ${location.label}`);
            button.setAttribute('aria-pressed', 'false');
            const dot = document.createElement('span');
            dot.className = 'globe-pin-dot';
            dot.setAttribute('aria-hidden', 'true');
            const label = document.createElement('span');
            label.className = 'globe-pin-label';
            label.textContent = location.name;
            button.append(dot, label);
            button.addEventListener('click', () => this.onSelect(location.id));
            this.pinLayer.append(button);
            return { button, location, vector: this.vector(location.latitude, location.longitude) };
        });

        this.requestDraw();
    }

    random(seed) {
        const value = Math.sin(seed * 127.1) * 43758.5453;
        return value - Math.floor(value);
    }

    vector(latitude, longitude) {
        const lat = latitude * Math.PI / 180;
        const lon = longitude * Math.PI / 180;
        return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
    }

    project([x, y, z], scale = 1) {
        const rx = x * this.cy + z * this.sy;
        const rz = z * this.cy - x * this.sy;
        const ry = y * this.cp - rz * this.sp;
        return {
            x: this.centerX + rx * this.radius * scale,
            y: this.centerY - ry * this.radius * scale,
            z: y * this.sp + rz * this.cp,
        };
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.round(rect.width * this.dpr);
        this.canvas.height = Math.round(rect.height * this.dpr);
        this.pins.forEach((pin) => { pin.width = null; });
        this.requestDraw();
    }

    stopFrame() {
        cancelAnimationFrame(this.frame);
        this.frame = null;
        this.lastTime = 0;
    }

    requestDraw() {
        if (this.ctx && this.visible && !document.hidden && this.frame === null) {
            this.frame = requestAnimationFrame((time) => this.render(time));
        }
    }

    setRotating(rotating) {
        this.clearResumeTimer();
        this.rotationEnabled = !!rotating && !!this.ctx;
        this.rotating = !!rotating && !!this.ctx;
        this.target = null;
        this.onStateChange(this);
        this.requestDraw();
    }

    clearResumeTimer() {
        clearTimeout(this.resumeTimer);
        this.resumeTimer = null;
    }

    pauseForInteraction({ cancelFocus = false } = {}) {
        this.clearResumeTimer();
        const wasRotating = this.rotating;
        this.rotating = false;
        if (cancelFocus) this.target = null;
        if (wasRotating || cancelFocus) this.onStateChange(this);
        this.requestDraw();
    }

    scheduleResume() {
        this.clearResumeTimer();
        if (!this.ctx || !this.rotationEnabled || this.rotating
            || this.drag || this.target || this.focused || !this.visible || document.hidden) return;
        this.resumeTimer = setTimeout(() => {
            this.resumeTimer = null;
            if (!this.rotationEnabled || this.drag || this.target
                || this.focused || !this.visible || document.hidden) return;
            this.rotating = true;
            this.onStateChange(this);
            this.requestDraw();
        }, this.resumeDelay);
    }

    setZoom(value) {
        this.pauseForInteraction();
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, value));
        if (this.target) this.target.zoom = this.zoom;
        this.onStateChange(this);
        this.requestDraw();
        this.scheduleResume();
    }

    setZoomRange(min, max) {
        this.minZoom = min;
        this.maxZoom = max;
    }

    focusLocation(id) {
        const location = this.locations.find((entry) => entry.id === id);
        if (!location) return;
        this.focusPoint(location, { zoom: this.target?.zoom ?? this.zoom });
    }

    focusPoint(location, { zoom = this.zoom, rotating = false, revealAfterFocus = false } = {}) {
        this.clearResumeTimer();
        this.selectedId = location.id || null;
        this.rotating = rotating && this.rotationEnabled && !!this.ctx;
        this.waitForFocus = revealAfterFocus;
        // Take the shortest path around the sphere when changing destinations.
        const longitude = -location.longitude * Math.PI / 180;
        const difference = Math.atan2(Math.sin(longitude - this.yaw), Math.cos(longitude - this.yaw));
        const pitch = location.latitude * Math.PI / 180;
        if (this.motion.matches) {
            this.target = null;
            this.yaw += difference;
            this.pitch = pitch;
            this.zoom = zoom;
        } else {
            this.target = { yaw: this.yaw + difference, pitch, zoom };
        }
        this.pins.forEach((pin) => pin.button.setAttribute('aria-pressed', String(pin.location.id === this.selectedId)));
        this.onStateChange(this);
        this.requestDraw();
        this.scheduleResume();
    }

    reset() {
        this.target = null;
        this.yaw = -.55;
        this.pitch = .12;
        this.zoom = 1;
        this.waitForFocus = false;
        this.selectedId = null;
        this.pins.forEach((pin) => pin.button.setAttribute('aria-pressed', 'false'));
        this.setRotating(!this.motion.matches);
    }

    bindControls() {
        const canvas = this.canvas;
        const stage = canvas.parentElement;
        document.addEventListener('keydown', () => { this.pointerInput = false; });
        stage.addEventListener('pointerdown', () => {
            this.pointerInput = true;
            this.focused = false;
            this.pauseForInteraction();
        });
        stage.addEventListener('pointerenter', () => {
            this.pauseForInteraction();
            this.scheduleResume();
        });
        stage.addEventListener('pointermove', () => {
            this.pauseForInteraction();
            this.scheduleResume();
        });
        stage.addEventListener('pointerleave', () => {
            this.scheduleResume();
        });
        stage.addEventListener('focusin', (event) => {
            this.focused = !this.pointerInput && event.target.matches(':focus-visible');
            if (this.focused) this.pauseForInteraction();
        });
        stage.addEventListener('focusout', (event) => {
            if (event.relatedTarget && stage.contains(event.relatedTarget)) return;
            this.focused = false;
            this.scheduleResume();
        });
        stage.addEventListener('keydown', () => {
            this.focused = true;
            this.pauseForInteraction();
        });
        canvas.addEventListener('pointerdown', (event) => {
            if (!event.isPrimary || event.button !== 0) return;
            this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, active: false };
        });
        canvas.addEventListener('pointermove', (event) => {
            if (!this.drag || event.pointerId !== this.drag.id) return;
            const dx = event.clientX - this.drag.x;
            const dy = event.clientY - this.drag.y;
            if (!this.drag.active && Math.hypot(dx, dy) < 4) return;
            if (!this.drag.active) {
                this.drag.active = true;
                canvas.setPointerCapture(event.pointerId);
                canvas.classList.add('is-dragging');
                this.pauseForInteraction({ cancelFocus: true });
            }
            this.yaw += dx * .006;
            this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch + dy * .006));
            this.drag.x = event.clientX;
            this.drag.y = event.clientY;
            this.requestDraw();
            this.scheduleResume();
        });
        const endDrag = () => {
            this.drag = null;
            canvas.classList.remove('is-dragging');
            this.requestDraw();
            this.scheduleResume();
        };
        canvas.addEventListener('pointerup', endDrag);
        canvas.addEventListener('pointercancel', endDrag);
        canvas.addEventListener('lostpointercapture', endDrag);
        canvas.addEventListener('keydown', (event) => {
            const directions = { ArrowLeft: [-.12, 0], ArrowRight: [.12, 0], ArrowUp: [0, -.1], ArrowDown: [0, .1] };
            if (directions[event.key]) {
                event.preventDefault();
                this.pauseForInteraction({ cancelFocus: true });
                this.yaw += directions[event.key][0];
                this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch + directions[event.key][1]));
            } else if (['+', '=', '-'].includes(event.key)) {
                event.preventDefault();
                this.setZoom(this.zoom + (event.key === '-' ? -.1 : .1));
            } else return;
            this.requestDraw();
        });
    }

    drawLines(lines, color, width, front = true) {
        const ctx = this.ctx;
        ctx.beginPath();
        for (const line of lines) {
            let previous = null;
            for (const vector of line) {
                const point = this.project(vector);
                const visible = front ? point.z >= 0 : point.z < 0;
                if (previous) {
                    const wasVisible = front ? previous.z >= 0 : previous.z < 0;
                    if (wasVisible !== visible) {
                        const t = previous.z / (previous.z - point.z);
                        const x = previous.x + (point.x - previous.x) * t;
                        const y = previous.y + (point.y - previous.y) * t;
                        if (wasVisible) ctx.lineTo(x, y);
                        else ctx.moveTo(x, y);
                    }
                    if (visible) ctx.lineTo(point.x, point.y);
                } else if (visible) ctx.moveTo(point.x, point.y);
                previous = point;
            }
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }

    drawOrbits(front) {
        const ctx = this.ctx;
        for (let ring = 0; ring < 2; ring++) {
            const angle = ring ? -.53 : .42;
            ctx.beginPath();
            let connected = false;
            for (let i = 0; i <= 180; i++) {
                const t = i * Math.PI / 90;
                const x = Math.cos(t) * this.radius * (ring ? 1.2 : 1.13);
                const y = Math.sin(t) * this.radius * .29;
                const isFront = Math.sin(t) >= 0;
                const px = this.centerX + x * Math.cos(angle) - y * Math.sin(angle);
                const py = this.centerY + x * Math.sin(angle) + y * Math.cos(angle);
                if (isFront !== front) { connected = false; continue; }
                if (connected) ctx.lineTo(px, py);
                else ctx.moveTo(px, py);
                connected = true;
            }
            ctx.strokeStyle = ring ? '#edb76b70' : '#65dbf352';
            ctx.lineWidth = .65;
            ctx.stroke();
        }
    }

    positionPins() {
        // Keep close destinations individually clickable without moving their
        // geographic anchors. Callout lines connect displaced labels to the map.
        const visible = [];
        for (const pin of this.pins) {
            const point = this.project(pin.vector, 1.018);
            pin.button.hidden = (this.waitForFocus && !!this.target) || point.z < .12
                || point.x < 10 || point.x > this.width - 10
                || point.y < 25 || point.y > this.height - 65;
            if (!pin.button.hidden) visible.push({ pin, point });
        }
        const occupied = [];
        visible.sort((a, b) => a.point.y - b.point.y);
        for (const { pin, point } of visible) {
            const width = pin.width || (pin.width = pin.button.offsetWidth);
            const preferLeft = point.x > this.width * .65;
            let placement = null;
            let bestScore = Infinity;
            for (const left of [preferLeft, !preferLeft]) {
                const minX = left ? width - 6 : 22;
                const maxX = left ? this.width - 22 : this.width - width + 6;
                const x = Math.max(minX, Math.min(maxX, point.x));
                for (let step = 0; step <= 12; step++) {
                    const offset = Math.ceil(step / 2) * 48 * (step % 2 ? 1 : -1);
                    const y = Math.max(42, Math.min(this.height - 84, point.y + offset));
                    const box = { x: x - (left ? width - 14 : 14), y: y - 22, width, height: 44 };
                    const overlap = occupied.some((other) => box.x < other.x + other.width + 4 && box.x + width + 4 > other.x && box.y < other.y + other.height + 4 && box.y + 48 > other.y);
                    if (overlap) continue;
                    const score = Math.abs(y - point.y) + Math.abs(x - point.x) + (left !== preferLeft ? 10 : 0);
                    if (score < bestScore) {
                        placement = { x, y, left, box };
                        bestScore = score;
                    }
                }
            }
            if (!placement) {
                const x = point.x, y = point.y;
                placement = { x, y, left: preferLeft, box: { x: x - 14, y: y - 22, width, height: 44 } };
            }
            occupied.push(placement.box);
            pin.button.classList.toggle('is-left', placement.left);
            pin.button.style.left = `${placement.x}px`;
            pin.button.style.top = `${placement.y}px`;
            if (Math.hypot(placement.x - point.x, placement.y - point.y) > 3) {
                const ctx = this.ctx;
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(placement.x, placement.y);
                ctx.strokeStyle = '#f4c78385';
                ctx.lineWidth = .75;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = '#ffe0a8';
                ctx.fill();
            }
        }
    }

    render(time) {
        this.frame = null;
        const elapsed = this.lastTime ? Math.min((time - this.lastTime) / 1000, .05) : 1 / 60;
        this.lastTime = time;
        const spinning = this.rotating && !this.focused && !this.drag;
        if (this.target) {
            const easing = 1 - Math.exp(-elapsed * 5);
            this.yaw += (this.target.yaw - this.yaw) * easing;
            this.pitch += (this.target.pitch - this.pitch) * easing;
            this.zoom += (this.target.zoom - this.zoom) * easing;
            if (Math.abs(this.target.yaw - this.yaw) + Math.abs(this.target.pitch - this.pitch)
                + Math.abs(this.target.zoom - this.zoom) < .002) {
                this.yaw = this.target.yaw;
                this.pitch = this.target.pitch;
                this.zoom = this.target.zoom;
                this.target = null;
                this.waitForFocus = false;
                this.onStateChange(this);
                this.scheduleResume();
            }
        } else if (spinning) this.yaw = (this.yaw + elapsed * .09) % (Math.PI * 2);
        const ctx = this.ctx;
        if (!this.width || !this.height) return;
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.clearRect(0, 0, this.width, this.height);
        this.centerX = this.width * .49;
        this.centerY = this.height * .46;
        this.radius = Math.min(this.width * .35, this.height * .36) * this.zoom;
        this.cy = Math.cos(this.yaw); this.sy = Math.sin(this.yaw);
        this.cp = Math.cos(this.pitch); this.sp = Math.sin(this.pitch);
        const x = this.centerX, y = this.centerY, r = this.radius;

        for (const star of this.stars) {
            ctx.fillStyle = '#72d7ed45';
            ctx.fillRect(star.x * this.width, star.y * this.height, star.r, star.r);
        }
        const aura = ctx.createRadialGradient(x, y, r * .85, x, y, r * 1.45);
        aura.addColorStop(0, '#23bbdb00');
        aura.addColorStop(.25, '#28d8f51b');
        aura.addColorStop(.43, '#28d8f508');
        aura.addColorStop(1, '#28d8f500');
        ctx.fillStyle = aura;
        ctx.fillRect(0, 0, this.width, this.height);
        this.drawOrbits(false);

        const ocean = ctx.createRadialGradient(x - r * .35, y - r * .3, r * .05, x, y, r);
        ocean.addColorStop(0, '#0a2839');
        ocean.addColorStop(.65, '#061b2a');
        ocean.addColorStop(.92, '#082b3b');
        ocean.addColorStop(1, '#15566a');
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = ocean; ctx.fill();

        this.drawLines(this.grid, '#58d3ed10', .5, false);
        this.drawLines(this.coasts, '#6eeaff13', .65, false);
        this.drawLines(this.grid, '#67d8ed2b', .55);
        for (const vector of this.land) {
            const point = this.project(vector);
            if (point.z < 0) continue;
            ctx.globalAlpha = .25 + point.z * .5;
            ctx.fillStyle = '#6eeaff';
            const size = (.65 + point.z * .55) * Math.min(this.zoom, 1.6);
            ctx.fillRect(point.x, point.y, size, size);
        }
        ctx.globalAlpha = 1;
        this.drawLines(this.borders, '#65daed40', .55);
        ctx.shadowColor = '#3fe3ff';
        ctx.shadowBlur = 5;
        this.drawLines(this.coasts, '#83eeffc9', .85);
        ctx.shadowBlur = 0;

        // A luminous atmospheric rim and instrument ticks frame the sphere.
        ctx.beginPath(); ctx.arc(x, y, r + 1, 0, Math.PI * 2);
        ctx.strokeStyle = '#7aefffaa'; ctx.lineWidth = 1.4;
        ctx.shadowColor = '#37dfff'; ctx.shadowBlur = 16; ctx.stroke(); ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(x, y, r * 1.045, -.8, 1.1);
        ctx.strokeStyle = '#86f0ff66'; ctx.lineWidth = .7; ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 120; i++) {
            const a = i * Math.PI / 60;
            const outer = r * (i % 10 === 0 ? 1.095 : 1.075);
            ctx.moveTo(x + Math.cos(a) * r * 1.06, y + Math.sin(a) * r * 1.06);
            ctx.lineTo(x + Math.cos(a) * outer, y + Math.sin(a) * outer);
        }
        ctx.strokeStyle = '#79d5ec45'; ctx.lineWidth = .7; ctx.stroke();
        this.drawOrbits(true);

        this.positionPins();
        if (spinning || this.target) this.requestDraw();
        else this.lastTime = 0;
    }
}
