(() => {
    const section = document.getElementById('travels');
    const catalogue = window.PHOTO_DATA;
    if (!section || !catalogue) return;
    const byId = (id) => document.getElementById(id);
    const locations = catalogue.locations.filter((location) => catalogue.photos.some((photo) => photo.location === location.id));
    const countries = catalogue.countries.filter((country) => locations.some((location) => location.country === country.id))
        .map((country) => ({ ...country, kind: 'country' }));
    const taggedPhotos = catalogue.photos.filter((photo) => locations.some((location) => location.id === photo.location));
    let currentLocation = null;
    let currentCountry = null;
    let worldRotating = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    let photos = [];
    let photoIndex = 0;
    let globe;

    // This decorative SVG is static: regenerate only when its dimensions change.
    document.querySelectorAll('.travel-transition').forEach((transition, index) => {
        const svg = transition.querySelector('svg');
        const suffix = index ? `-${index}` : '';
        const sheenId = `travel-hex-sheen${suffix}`;
        const settleId = `travel-hex-settle${suffix}`;
        let previousSize = '';
        const palette = [
            [0, [255, 255, 255]], [.2, [255, 255, 255]],
            [.4, [243, 246, 248]], [.58, [188, 206, 213]],
            [.76, [49, 81, 100]], [.9, [10, 28, 42]], [1, [4, 14, 24]],
        ];
        const random = (seed) => {
            const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
            return value - Math.floor(value);
        };
        const colorAt = (position) => {
            const p = Math.max(0, Math.min(1, position));
            const upper = palette.findIndex(([stop]) => stop >= p);
            if (upper === 0) return 'rgb(255,255,255)';
            const [start, a] = palette[upper - 1];
            const [end, b] = palette[upper];
            const t = (p - start) / (end - start);
            return `rgb(${a.map((channel, i) => Math.round(channel + (b[i] - channel) * t)).join(',')})`;
        };
        new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            const size = `${Math.round(width)}:${Math.round(height)}`;
            if (!width || !height || size === previousSize) return;
            previousSize = size;
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
            const radius = width <= 650 ? 12 : Math.max(16, Math.min(24, width / 72));
            const spacingX = Math.sqrt(3) * radius;
            const spacingY = radius * 1.5;
            // Anchor the grid at the bottom so its final rows form a continuous surface.
            const rows = Math.floor((height - radius * 2) / spacingY) + 1;
            const startY = height - radius - (rows - 1) * spacingY;
            const shapes = [
                `<defs><linearGradient id="${sheenId}" x1="0" y1="0" x2="1" y2="1">`,
                '<stop stop-color="#ffffff" stop-opacity=".2"/>',
                '<stop offset=".45" stop-color="#ffffff" stop-opacity="0"/>',
                '<stop offset="1" stop-color="#020b13" stop-opacity=".2"/>',
                '</linearGradient>',
                `<linearGradient id="${settleId}" x1="0" y1="0" x2="0" y2="1">`,
                '<stop offset=".7" stop-color="#040e18" stop-opacity="0"/>',
                '<stop offset=".82" stop-color="#040e18" stop-opacity=".2"/>',
                '<stop offset=".97" stop-color="#040e18" stop-opacity="1"/>',
                '<stop offset="1" stop-color="#040e18"/>',
                '</linearGradient></defs>',
            ];
            for (let row = 0; row < rows; row++) {
                const y = startY + row * spacingY;
                const progress = y / height;
                const connected = row >= rows - 2;
                const join = Math.max(0, Math.min(1, (progress - .55) / .25));
                const density = connected ? 1 : Math.min(1, .06 + Math.pow(progress, 1.4) * 1.5);
                for (let column = -1; column <= Math.ceil(width / spacingX); column++) {
                    const seed = row * 997 + column * 31 + 17;
                    if (random(seed) > density) continue;
                    const looseScale = Math.min(.96, .58 + progress * .46) * (.94 + random(seed + 1) * .06);
                    const scale = connected ? 1 : looseScale + (1 - looseScale) * join;
                    const r = radius * scale;
                    const separation = connected ? 0 : (1 - progress) * (1 - join) * radius * .3;
                    const cx = radius + column * spacingX + (row % 2 ? spacingX / 2 : 0) + (random(seed + 2) - .5) * separation;
                    const cy = y + (random(seed + 3) - .5) * separation;
                    if (connected) {
                        if (cx + r < 0 || cx - r > width) continue;
                    } else if (cx - r < 0 || cx + r > width || cy - r < 0 || cy + r > height) continue;
                    const points = Array.from({ length: 6 }, (_, i) => {
                        const angle = (i * 60 - 90) * Math.PI / 180;
                        return `${(cx + Math.cos(angle) * r).toFixed(2)},${(cy + Math.sin(angle) * r).toFixed(2)}`;
                    }).join(' ');
                    const tone = progress + .13 + random(seed + 4) * .1;
                    const edge = .08 + progress * .25;
                    shapes.push('<g>',
                        `<polygon points="${points}" fill="${colorAt(tone)}"/>`,
                        `<polygon points="${points}" fill="url(#${sheenId})" stroke="#6eeaff" stroke-opacity="${edge.toFixed(2)}" stroke-width=".7"/>`,
                        '</g>');
                }
            }
            // Fade both faces and outlines into the exact Travels background color.
            shapes.push(`<rect width="100%" height="100%" fill="url(#${settleId})"/>`);
            svg.innerHTML = shapes.join('');
        }).observe(transition);
    });

    const counter = byId('travel-counter');
    const count = document.createElement('span');
    count.textContent = `${String(countries.length).padStart(2, '0')} countries`;
    counter.append(count, document.createElement('br'), `${String(taggedPhotos.length).padStart(2, '0')} photographs`);

    function renderDestinations() {
        const entries = currentCountry ? locations.filter((location) => location.country === currentCountry.id) : countries;
        const list = byId('travel-destinations');
        list.replaceChildren();
        list.scrollTop = 0;
        list.setAttribute('aria-label', currentCountry ? `Destinations in ${currentCountry.name}` : 'Choose a country');
        byId('travel-level-label').textContent = currentCountry ? `Explore ${currentCountry.name}` : 'Explore by country';
        byId('travel-breadcrumb').hidden = !currentCountry;
        byId('travel-country-name').textContent = currentCountry?.name || '';
        byId('globe-view-label').textContent = currentCountry ? `${currentCountry.name} / Destinations` : 'Earth / Countries';
        byId('globe-reset').textContent = currentCountry ? 'World' : 'Reset';
        byId('globe-reset').setAttribute('aria-label', currentCountry ? 'Back to world overview' : 'Reset globe view');
        byId('travel-empty-title').textContent = currentCountry ? `Discover ${currentCountry.name}.` : 'Every country has a story.';
        byId('travel-empty-description').textContent = currentCountry
            ? 'Select a destination pin or a place in the list to discover its photographs.'
            : 'Select a country to zoom in and discover the places and photographs within it.';
        byId('globe-instructions').textContent = currentCountry
            ? 'Select a place · World to zoom back out' : 'Drag to explore · Select a country';
        entries.forEach((location, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'travel-location';
            if (currentCountry) button.dataset.location = location.id;
            else button.dataset.country = location.id;
            button.setAttribute('aria-pressed', 'false');
            button.setAttribute('aria-controls', currentCountry ? 'travel-selection' : 'travel-destinations');
            const number = document.createElement('span');
            number.className = 'travel-number';
            number.textContent = String(index + 1).padStart(2, '0');
            const name = document.createElement('span');
            name.className = 'travel-location-name';
            name.textContent = location.name;
            const places = currentCountry ? [location] : locations.filter((place) => place.country === location.id);
            const total = catalogue.photos.filter((photo) => places.some((place) => photo.location === place.id)).length;
            const photoCount = document.createElement('span');
            photoCount.className = 'travel-location-count';
            photoCount.textContent = currentCountry ? `${total} ${total === 1 ? 'photo' : 'photos'} ↗`
                : `${places.length} ${places.length === 1 ? 'place' : 'places'} · ${total} photos ↗`;
            button.setAttribute('aria-label', `${location.name}, ${total} photographs${currentCountry ? '' : `, ${places.length} destinations`}`);
            button.append(number, name, photoCount);
            button.addEventListener('click', () => currentCountry ? selectLocation(location.id) : openCountry(location.id));
            list.append(button);
        });
    }

    function clearPhotos() {
        currentLocation = null;
        photos = [];
        photoIndex = 0;
        byId('travel-selection').hidden = true;
        byId('travel-empty').hidden = false;
    }

    function openCountry(id, { autoSelect = true } = {}) {
        const country = countries.find((entry) => entry.id === id);
        if (!country) return;
        if (!currentCountry) worldRotating = globe.rotationEnabled;
        currentCountry = country;
        clearPhotos();
        renderDestinations();
        const places = locations.filter((location) => location.country === id);
        globe.setZoomRange(1.6, 8);
        globe.setLocations(places);
        globe.focusPoint(country, { zoom: country.zoom || 5, revealAfterFocus: true });
        byId('travel-announcement').textContent = `${country.name}: ${places.length} destinations. Zooming in. Choose a destination to view photographs.`;
        // Country-only geotags have no invented city to drill into.
        if (autoSelect && places.length === 1 && places[0].precision === 'Country-level location') {
            selectLocation(places[0].id, { focus: false, scroll: false });
        }
    }

    function returnToWorld({ reset = false, focus = false } = {}) {
        currentCountry = null;
        clearPhotos();
        renderDestinations();
        globe.setLocations(countries);
        globe.setZoomRange(.75, 1.35);
        if (reset) globe.reset();
        else globe.focusPoint({ latitude: globe.pitch * 180 / Math.PI, longitude: -globe.yaw * 180 / Math.PI },
            { zoom: 1, rotating: worldRotating, revealAfterFocus: true });
        byId('travel-announcement').textContent = 'World overview. Choose a country.';
        if (focus) byId('travel-destinations').querySelector('button')?.focus({ preventScroll: true });
    }

    function showPhoto() {
        const photo = photos[photoIndex];
        if (!photo) return;
        byId('travel-photo').src = photo.src;
        byId('travel-photo').alt = photo.alt;
        byId('travel-photo-title').textContent = photo.alt;
        byId('travel-location-detail').textContent = [currentLocation.precision, photo.locationNote].filter(Boolean).join(' · ');
        byId('travel-photo-open').setAttribute('aria-label', `Enlarge ${photo.alt}`);
        byId('travel-photo-count').textContent = `${photoIndex + 1} / ${photos.length}`;
        byId('travel-photo-previous').disabled = photoIndex === 0;
        byId('travel-photo-next').disabled = photoIndex === photos.length - 1;
        byId('travel-gallery-link').href = `photography.html#${encodeURIComponent(photo.id)}`;
        byId('travel-announcement').textContent = `${currentLocation.label}: ${photo.alt}. Photograph ${photoIndex + 1} of ${photos.length}.`;
    }

    function selectLocation(id, { focus = true, scroll = true } = {}) {
        const location = locations.find((entry) => entry.id === id);
        if (!location) return;
        if (currentCountry?.id !== location.country) openCountry(location.country, { autoSelect: false });
        currentLocation = location;
        photos = catalogue.photos.filter((photo) => photo.location === id);
        photoIndex = 0;
        byId('travel-empty').hidden = true;
        byId('travel-selection').hidden = false;
        byId('travel-location-title').textContent = location.label;
        byId('travel-location-detail').textContent = location.precision;
        section.querySelectorAll('.travel-location').forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.location === id));
        });
        if (focus) globe.focusLocation(id);
        showPhoto();
        if (scroll && matchMedia('(max-width: 650px)').matches) {
            requestAnimationFrame(() => byId('travel-selection').scrollIntoView({
                block: 'nearest',
                behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
            }));
        }
    }

    function updateControls(state) {
        byId('globe-rotation').textContent = state.rotationEnabled ? 'Pause spin' : 'Resume spin';
        byId('globe-rotation').setAttribute('aria-pressed', String(state.rotationEnabled));
        byId('globe-rotation').disabled = !state.ctx;
        byId('globe-zoom-in').disabled = !state.ctx || state.zoom >= state.maxZoom;
        byId('globe-zoom-out').disabled = !state.ctx || state.zoom <= state.minZoom;
        byId('globe-status').textContent = !state.ctx ? 'Choose a country to explore'
            : state.target ? 'Focusing view' : currentCountry ? `${currentCountry.name} / Destination view`
                : state.rotating ? 'Auto rotation / On' : state.rotationEnabled ? 'Auto rotation / Waiting' : 'Spin / Paused';
    }

    globe = new TravelGlobe(byId('travel-globe'), byId('globe-pins'), countries,
        (id) => currentCountry ? selectLocation(id) : openCountry(id), updateControls);
    renderDestinations();
    byId('globe-rotation').addEventListener('click', () => globe.setRotating(!globe.rotationEnabled));
    byId('globe-zoom-in').addEventListener('click', () => globe.setZoom(globe.zoom + (currentCountry ? .4 : .1)));
    byId('globe-zoom-out').addEventListener('click', () => globe.setZoom(globe.zoom - (currentCountry ? .4 : .1)));
    byId('globe-reset').addEventListener('click', () => returnToWorld({ reset: !currentCountry }));
    byId('travel-world').addEventListener('click', () => returnToWorld({ focus: true }));
    section.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && currentCountry) {
            event.preventDefault();
            returnToWorld({ focus: true });
        }
    });
    byId('travel-photo-previous').addEventListener('click', () => { if (photoIndex > 0) { photoIndex--; showPhoto(); } });
    byId('travel-photo-next').addEventListener('click', () => { if (photoIndex < photos.length - 1) { photoIndex++; showPhoto(); } });
    byId('travel-back-globe').addEventListener('click', () => {
        byId('travel-globe').scrollIntoView({
            block: 'center',
            behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        });
        byId('travel-globe').focus({ preventScroll: true });
    });

    const dialog = byId('travel-lightbox');
    byId('travel-photo-open').addEventListener('click', () => {
        const photo = photos[photoIndex];
        if (!photo) return;
        byId('travel-lightbox-image').src = photo.src;
        byId('travel-lightbox-image').alt = photo.alt;
        byId('travel-lightbox-caption').textContent = `${photo.alt} · ${currentLocation.label}`;
        dialog.showModal();
    });
    byId('travel-lightbox-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });

    const initialLocation = new URLSearchParams(window.location.search).get('location');
    if (initialLocation) selectLocation(initialLocation);
})();
