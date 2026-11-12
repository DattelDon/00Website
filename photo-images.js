// Shared responsive image selection. Originals remain in photo-data.js.
window.PHOTO_IMAGES = (() => {
    function variants(photo) {
        const entry = window.PHOTO_VARIANTS?.[photo.id];
        return entry?.original === photo.src ? entry : null;
    }

    function preview(image, photo, { sizes = '100vw', preserveRatio = false } = {}) {
        const entry = variants(photo);
        if (!entry) {
            image.removeAttribute('srcset');
            image.removeAttribute('sizes');
            image.src = photo.src;
            return;
        }
        if (preserveRatio) {
            image.width = entry.width;
            image.height = entry.height;
            image.style.aspectRatio = `${entry.width} / ${entry.height}`;
        }
        image.sizes = sizes;
        image.srcset = entry.previews.map((file) => `${file.src} ${file.width}w`).join(', ');
        image.src = entry.previews[0].src;
    }

    function large(image, photo) {
        image.removeAttribute('srcset');
        image.removeAttribute('sizes');
        image.src = variants(photo)?.large.src || photo.src;
    }

    return { preview, large };
})();
