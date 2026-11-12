(() => {
    const gallery = document.querySelector('.photo-gallery');
    if (!gallery) return;

    // The catalogue is the single source for images and their location tags.
    const catalogue = window.PHOTO_DATA;
    const photosById = new Map((catalogue?.photos || []).map((photo) => [photo.id, photo]));
    const previewOptions = {
        sizes: '(max-width: 650px) calc(100vw - 40px), (max-width: 1000px) calc((100vw - 78px) / 2), (max-width: 1400px) calc((100vw - 96px) / 3), 435px',
        preserveRatio: true,
    };
    if (catalogue) {
        catalogue.photos.forEach((photo) => {
            const item = document.createElement('figure');
            item.className = 'gallery-item';
            item.id = photo.id;
            if (photo.location) item.dataset.location = photo.location;
            const image = document.createElement('img');
            image.alt = photo.alt;
            image.loading = 'lazy';
            image.decoding = 'async';
            if (window.PHOTO_IMAGES) window.PHOTO_IMAGES.preview(image, photo, previewOptions);
            else image.src = photo.src;
            item.append(image);
            gallery.append(item);
        });
    }

    let selected = null;
    const timers = new WeakMap();

    function clearSelection() {
        if (!selected) return;
        const item = selected;
        selected = null;
        item.classList.remove('is-selected');
        item.classList.add('is-returning');
        item.style.transform = '';
        item.querySelector('button').setAttribute('aria-pressed', 'false');
        timers.set(item, setTimeout(() => {
            item.classList.remove('is-returning');
            const photo = photosById.get(item.id);
            if (photo) window.PHOTO_IMAGES?.preview(item.querySelector('img'), photo, previewOptions);
            timers.delete(item);
        }, 500));
    }

    function selectPhoto(item) {
        if (selected === item) {
            clearSelection();
            return;
        }
        clearSelection();
        clearTimeout(timers.get(item));
        timers.delete(item);
        item.classList.remove('is-returning');

        // Layout coordinates remain stable, even if a previous animation is running.
        const button = item.querySelector('button');
        const width = item.offsetWidth;
        const height = item.offsetHeight;
        if (!width || !height) return;
        const rect = item.getBoundingClientRect();
        const galleryRect = gallery.getBoundingClientRect();
        const headerBottom = document.querySelector('header').getBoundingClientRect().bottom;
        const top = Math.max(12, headerBottom + 12);
        const availableHeight = window.innerHeight - top - 12;
        const availableWidth = Math.min(galleryRect.width + 24, document.documentElement.clientWidth - 24);
        const scale = Math.max(1, Math.min(2.2, availableWidth / width, availableHeight / height));
        const expandedWidth = width * scale;
        const expandedHeight = height * scale;
        const transform = getComputedStyle(item).transform;
        const matrix = transform === 'none' ? new DOMMatrix() : new DOMMatrix(transform);
        const centerX = rect.left + rect.width / 2 - matrix.m41;
        const centerY = rect.top + rect.height / 2 - matrix.m42;
        const targetX = Math.max(12 + expandedWidth / 2,
            Math.min(document.documentElement.clientWidth - 12 - expandedWidth / 2, centerX));
        const targetY = expandedHeight <= availableHeight
            ? Math.max(top + expandedHeight / 2,
                Math.min(window.innerHeight - 12 - expandedHeight / 2, centerY))
            : centerY;

        selected = item;
        item.classList.add('is-selected');
        button.setAttribute('aria-pressed', 'true');
        item.style.transform = `translate(${targetX - centerX}px, ${targetY - centerY}px) scale(${scale})`;
        const photo = photosById.get(item.id);
        if (photo) window.PHOTO_IMAGES?.large(item.querySelector('img'), photo);
    }

    gallery.querySelectorAll('.gallery-item').forEach((item) => {
        const image = item.querySelector('img');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'photo-select';
        button.setAttribute('aria-label', `Enlarge photo: ${image.alt}`);
        button.setAttribute('aria-pressed', 'false');
        image.before(button);
        button.append(image);
        button.addEventListener('click', () => selectPhoto(item));
        const location = catalogue?.locations.find((entry) => entry.id === item.dataset.location);
        if (location) {
            const link = document.createElement('a');
            link.className = 'gallery-location';
            link.href = `index.html?location=${encodeURIComponent(location.id)}#travels`;
            link.textContent = `${location.label} ↗`;
            link.setAttribute('aria-label', `Explore ${location.label} on the travel globe`);
            item.append(link);
        }
    });

    // A globe photograph links back to the same image in the collage.
    function revealLinkedPhoto() {
        gallery.querySelectorAll('.is-linked').forEach((item) => item.classList.remove('is-linked'));
        const item = document.getElementById(location.hash.slice(1));
        if (!item || !gallery.contains(item)) return;
        const image = item.querySelector('img');
        image.loading = 'eager';
        const reveal = () => {
            item.classList.add('is-linked');
            item.scrollIntoView({ block: 'center', behavior: 'instant' });
            item.querySelector('button').focus({ preventScroll: true });
        };
        if (image.complete) reveal();
        else image.addEventListener('load', reveal, { once: true });
    }
    window.addEventListener('hashchange', revealLinkedPhoto);
    revealLinkedPhoto();

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.photo-select')) clearSelection();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') clearSelection();
    });
    document.addEventListener('focusin', (event) => {
        if (selected && !selected.contains(event.target)) clearSelection();
    });
    window.addEventListener('resize', clearSelection);
    window.addEventListener('scroll', clearSelection, { passive: true });
})();
