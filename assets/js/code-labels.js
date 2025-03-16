document.addEventListener('DOMContentLoaded', function() {
    const codeBlocks = document.querySelectorAll('.highlighter-rouge');

    codeBlocks.forEach(block => {
        // Extract language from class name
        const languageClass = Array.from(block.classList)
            .find(cls => cls.startsWith('language-') && cls !== 'language-plaintext');

        if (languageClass) {
            const language = languageClass.replace('language-', '');
            const label = document.createElement('span');
            label.className = 'language-label';
            label.textContent = language.toUpperCase();
            block.appendChild(label);
        }
    });
});