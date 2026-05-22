(function () {
    var root = document.documentElement;
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    function updateCommentBox(theme) {
        var isDark = theme === 'dark';

        // Verificamos que la librería externa esté cargada y que exista el ID del proyecto
        if (typeof commentBox !== 'function' || !window.COMMENTBOX_PROJECT_ID) return;

        // Si ya hay una instancia activa, la destruimos
        if (typeof window.commentBoxInstance === 'function') {
            window.commentBoxInstance();
        }

        // Recuperamos el contenedor original y nos aseguramos de reponer su clase
        var boxContainer = document.querySelector('.commentbox') || document.querySelector('[id*="commentbox"]');
        if (boxContainer) {
            boxContainer.className = 'commentbox'; // Fuerza a limpiar otras clases y dejar solo esta
        }

        // Inicializamos usando la variable global segura
        window.commentBoxInstance = commentBox(window.COMMENTBOX_PROJECT_ID, {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            textColor: isDark ? '#f5f5f5' : '#2c3e50',
            subtextColor: isDark ? '#999999' : '#7f8c8d'
        });
    }

    function apply(theme) {
        root.setAttribute('data-theme', theme);
        try { localStorage.setItem('theme', theme); } catch (e) {}
        updateCommentBox(theme);
    }

    // Esperamos a que todo el DOM y scripts externos estén listos
    window.addEventListener('load', function() {
        var initialTheme = root.getAttribute('data-theme') || 'light';
        updateCommentBox(initialTheme);
    });

    btn.addEventListener('click', function () {
        var current = root.getAttribute('data-theme') || 'light';
        apply(current === 'dark' ? 'light' : 'dark');
    });
})();
