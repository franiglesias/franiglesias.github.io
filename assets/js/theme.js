(function () {
    var root = document.documentElement;
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    function updateCommentBox(theme) {
        var isDark = theme === 'dark';

        // CORRECCIÓN PROTECTORA: Si el script de CommentBox no ha cargado aún, 
        // no hacemos nada para evitar el ReferenceError. El evento 'load' o el clic reintentarán más tarde.
        if (typeof commentBox !== 'function' || !window.COMMENTBOX_PROJECT_ID) return;

        // Destruimos la instancia previa si existe
        if (typeof window.commentBoxInstance === 'function') {
            window.commentBoxInstance();
        }

        // Restauramos el contenedor limpio
        var boxContainer = document.querySelector('.commentbox') || document.querySelector('[id*="commentbox"]');
        if (boxContainer) {
            boxContainer.className = 'commentbox';
        }

        // Forzamos un retraso asíncrono para que el DOM se asiente
        setTimeout(function() {
            if (typeof commentBox === 'function') {
                window.commentBoxInstance = commentBox(window.COMMENTBOX_PROJECT_ID, {
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    textColor: isDark ? '#f5f5f5' : '#2c3e50',
                    subtextColor: isDark ? '#999999' : '#7f8c8d'
                });
            }
        }, 80);
    }

    function apply(theme) {
        root.setAttribute('data-theme', theme);
        try { localStorage.setItem('theme', theme); } catch (e) {}
        updateCommentBox(theme);
    }

    // EJECUCIÓN INICIAL SEGURA: 
    // Si la librería ya está en memoria, la cargamos. Si no, esperamos a que todo cargue ('load')
    if (typeof commentBox === 'function') {
        var initialTheme = root.getAttribute('data-theme') || 'light';
        updateCommentBox(initialTheme);
    } else {
        window.addEventListener('load', function() {
            var initialTheme = root.getAttribute('data-theme') || 'light';
            updateCommentBox(initialTheme);
        });
    }

    btn.addEventListener('click', function () {
        var current = root.getAttribute('data-theme') || 'light';
        var nextTheme = current === 'dark' ? 'light' : 'dark';
        apply(nextTheme);
    });
})();
