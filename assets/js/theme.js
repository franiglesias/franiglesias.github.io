(function () {
    var root = document.documentElement;
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    // Función para renderizar CommentBox con los colores del tema actual
    function updateCommentBox(theme) {
        var isDark = theme === 'dark';

        // Comprobamos que commentBox exista en la ventana global
        if (typeof commentBox !== 'function') return;

        // Si ya hay una instancia/función de limpieza activa, la ejecutamos
        if (typeof window.commentBoxInstance === 'function') {
            window.commentBoxInstance();
        }

        var boxContainer = document.querySelector('.commentbox') || document.querySelector('[id*="commentbox"]');
        if (boxContainer) {
            boxContainer.classList.add('commentbox');
        }

        // Inicializa la nueva instancia usando la variable de Jekyll
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

        // Aplica el cambio de color a los comentarios al cambiar de tema
        updateCommentBox(theme);
    }

    // CORRECCIÓN CLAVE: Esperamos a que la página se cargue por completo
    window.addEventListener('load', function () {
        var initialTheme = root.getAttribute('data-theme') || 'light';
        updateCommentBox(initialTheme);
    });

    btn.addEventListener('click', function () {
        var current = root.getAttribute('data-theme') || 'light';
        apply(current === 'dark' ? 'light' : 'dark');
    });
})();
