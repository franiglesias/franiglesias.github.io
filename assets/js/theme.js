(function () {
    var root = document.documentElement;
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    // Función para renderizar CommentBox con los colores del tema actual
    function updateCommentBox(theme) {
        var isDark = theme === 'dark';

        // Destruye la instancia anterior si ya existe
        if (window.commentBoxInstance) {
            window.commentBoxInstance.destroy();
        }

        // Inicializa la nueva instancia usando la variable de Jekyll
        window.commentBoxInstance = commentBox('{{ site.commentbox }}', {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            textColor: isDark ? '#f5f5f5' : '#2c3e50',
            subtextColor: isDark ? '#999999' : '#7f8c8d'
        });
    }

    function apply(theme) {
        root.setAttribute('data-theme', theme);
        try { localStorage.setItem('theme', theme); } catch (e) {}

        // Aplica el cambio de color a los comentarios al cambiar de tema
        updateCommentBox(theme);
    }

    // Carga inicial: lee el tema actual del HTML (o usa 'light' por defecto)
    var initialTheme = root.getAttribute('data-theme') || 'light';
    updateCommentBox(initialTheme);

    btn.addEventListener('click', function () {
        var current = root.getAttribute('data-theme') || 'light';
        apply(current === 'dark' ? 'light' : 'dark');
    });
})();
