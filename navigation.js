(() => {
    const header = document.querySelector('body > header');
    if (!header) return;

    let lastY = Math.max(0, window.scrollY);
    let direction = 0;
    let distance = 0;
    let frame = null;

    const reveal = () => header.classList.remove('is-nav-hidden');

    function update() {
        frame = null;
        // Clamp overscroll so bouncing at the top or bottom cannot flip direction.
        const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const y = Math.max(0, Math.min(limit, window.scrollY));
        const delta = y - lastY;
        lastY = y;

        if (y <= header.offsetHeight + 12) {
            reveal();
            direction = 0;
            distance = 0;
            return;
        }
        if (!delta) return;
        const nextDirection = Math.sign(delta);
        if (nextDirection !== direction) distance = 0;
        direction = nextDirection;
        distance += Math.abs(delta);

        if (direction < 0 && distance >= 8) reveal();
        else if (direction > 0 && distance >= 16 && !header.querySelector(':focus-visible')) {
            header.classList.add('is-nav-hidden');
        }
    }

    window.addEventListener('scroll', () => {
        if (frame === null) frame = requestAnimationFrame(update);
    }, { passive: true });

    // Tab can still reach the navigation while it is off screen.
    header.addEventListener('focusin', reveal);
    window.addEventListener('pageshow', () => {
        lastY = Math.max(0, window.scrollY);
        direction = 0;
        distance = 0;
        reveal();
    });

    new ResizeObserver(() => {
        document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
        lastY = Math.max(0, window.scrollY);
        direction = 0;
        distance = 0;
    }).observe(header);
})();
