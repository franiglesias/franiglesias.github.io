(function () {
    const root = document.documentElement;
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    function updateCommentBox(theme) {
        const iframe = document.getElementById('commentbox-iframe');
        if (!iframe) return;

        // Cambiamos el origen del iframe pasándole el nuevo tema en la URL.
        // Esto fuerza al navegador a recargar el frame de comentarios con el color correcto al instante.
        iframe.src = "/commentbox-bridge.html?theme=" + theme;
    }

    function apply(theme) {
        root.setAttribute('data-theme', theme);
        try { localStorage.setItem('theme', theme); } catch (e) {}

        // Actualiza el iframe de comentarios en tiempo real
        updateCommentBox(theme);
    }

    // Al cargar la página por primera vez con defer
    const initialTheme = root.getAttribute('data-theme') || 'light';
    updateCommentBox(initialTheme);

    btn.addEventListener('click', function () {
        const current = root.getAttribute('data-theme') || 'light';
        const nextTheme = current === 'dark' ? 'light' : 'dark';
        apply(nextTheme);
    });
})();
