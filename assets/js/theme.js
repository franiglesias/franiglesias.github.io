(function () {
    const root = document.documentElement;
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    function updateCommentBox(theme) {
        const isDark = theme === 'dark';

        // Si la librería de CommentBox aún no está lista, salimos de forma segura
        if (typeof commentBox !== 'function' || !window.COMMENTBOX_PROJECT_ID) return;

        // Limpieza de la instancia anterior
        if (typeof window.commentBoxInstance === 'function') {
            window.commentBoxInstance();
        }

        // Recuperamos el contenedor y restauramos su clase CSS estructural
        const boxContainer = document.querySelector('.commentbox') || document.querySelector('[id*="commentbox"]');
        if (boxContainer) {
            boxContainer.className = 'commentbox';
        }

        // Breve pausa para permitir al navegador asentar el cambio CSS antes de pedir el iframe
        setTimeout(function() {
            if (typeof commentBox === 'function') {
                window.commentBoxInstance = commentBox(window.COMMENTBOX_PROJECT_ID, {
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    textColor: isDark ? '#f5f5f5' : '#2c3e50',
                    subtextColor: isDark ? '#999999' : '#7f8c8d'
                });
            }
        }, 50);
    }

    function apply(theme) {
        root.setAttribute('data-theme', theme);
        try { localStorage.setItem('theme', theme); } catch (e) {}
        updateCommentBox(theme);
    }

    // CONTROL DE CARGA INICIAL PARA DEFER:
    // Si ya existe la función, inicializa. Si no, comprueba cada 50ms hasta que la CDN responda.
    function initWhenReady() {
        if (typeof commentBox === 'function' && window.COMMENTBOX_PROJECT_ID) {
            const initialTheme = root.getAttribute('data-theme') || 'light';
            updateCommentBox(initialTheme);
        } else {
            setTimeout(initWhenReady, 50);
        }
    }
    initWhenReady();

    // EVENTO DE CLIC INMEDIATO
    btn.addEventListener('click', function () {
        const current = root.getAttribute('data-theme') || 'light';
        const nextTheme = current === 'dark' ? 'light' : 'dark';
        apply(nextTheme);
    });
})();
