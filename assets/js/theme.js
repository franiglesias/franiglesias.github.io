(function () {
    const root = document.documentElement;
    const btn = document.getElementById('theme-toggle');
    if (!btn) {
        return;
    }

    function updateCommentBox(theme) {
        const isDark = theme === 'dark';

        if (typeof commentBox !== 'function') {
            return;
        }

        if (typeof window.commentBoxInstance === 'function') {
            window.commentBoxInstance();
        }

        const boxContainer = document.querySelector('.commentbox') || document.querySelector('[id*="commentbox"]');
        if (boxContainer) {
            boxContainer.classList.add('commentbox');
        }

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

        updateCommentBox(theme);
    }

    window.addEventListener('load', function () {
        const initialTheme = root.getAttribute('data-theme') || 'light';
        updateCommentBox(initialTheme);
    });

    btn.addEventListener('click', function () {
        const current = root.getAttribute('data-theme') || 'light';
        apply(current === 'dark' ? 'light' : 'dark');
    });
})();
