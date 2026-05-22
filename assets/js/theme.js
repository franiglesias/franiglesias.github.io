(function () {
    var root = document.documentElement;
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    function updateCommentBox(theme) {
        var isDark = theme === 'dark';

        // Verificación de seguridad para la librería y la variable global de Jekyll
        if (typeof commentBox !== 'function' || !window.COMMENTBOX_PROJECT_ID) return;

        // Si ya hay una instancia del iframe activa, la destruimos por completo
        if (typeof window.commentBoxInstance === 'function') {
            window.commentBoxInstance();
        }

        // Recuperamos el contenedor original de tu blog y le restauramos su clase limpia
        var boxContainer = document.querySelector('.commentbox') || document.querySelector('[id*="commentbox"]');
        if (boxContainer) {
            boxContainer.className = 'commentbox';
        }

        // Inicializamos el nuevo iframe pasándole los colores correspondientes en tiempo real
        window.commentBoxInstance = commentBox(window.COMMENTBOX_PROJECT_ID, {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            textColor: isDark ? '#f5f5f5' : '#2c3e50',
            subtextColor: isDark ? '#999999' : '#7f8c8d'
        });
    }

    function apply(theme) {
        root.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
        }

        // CORRECCIÓN CLAVE: Pasamos explícitamente el "nuevo" tema 
        // para que no intente leer el atributo del DOM antes de que cambie
        updateCommentBox(theme);
    }

    // Carga inicial sincronizada con la carga completa de recursos externos
    window.addEventListener('load', function () {
        var initialTheme = root.getAttribute('data-theme') || 'light';
        updateCommentBox(initialTheme);
    });

    btn.addEventListener('click', function () {
        var current = root.getAttribute('data-theme') || 'light';
        // Calculamos el siguiente tema y lo aplicamos directamente
        var nextTheme = current === 'dark' ? 'light' : 'dark';
        apply(nextTheme);
    });
})();
