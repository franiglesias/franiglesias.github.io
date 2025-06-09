function setButtonCopied(btn, originalText) {
    btn.dataset.originalText = btn.innerText;
    btn.innerText = '¡Copiado!';
    btn.disabled = true;
    setTimeout(function() {
        btn.innerText = originalText;
        btn.disabled = false;
    }, 1500);
}

function copyTextToClipboard(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(function () {
                setButtonCopied(btn, btn.dataset.originalText || btn.innerText);
            })
            .catch(function (err) {
                console.log('Fallo Clipboard API, usando fallback:', err);
                fallbackCopyTextToClipboard(text, btn);
            });
    } else {
        console.log('Clipboard API no disponible, usando fallback.');
        fallbackCopyTextToClipboard(text, btn);
    }
}

function fallbackCopyTextToClipboard(text, btn) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-1000px';
    textArea.style.left = '-1000px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            setButtonCopied(btn, btn.dataset.originalText || btn.innerText);
        } else {
            alert('No se pudo copiar el enlace (fallback).');
        }
    } catch (err) {
        alert('No se pudo copiar el enlace (error en fallback).');
        console.log('Error en fallback:', err);
    }
    document.body.removeChild(textArea);
}

function copyAsQuote(event) {
    const text = `${window.location.href} recuperado el día ${new Date().toLocaleString('es-ES')}`;
    const btn = event.currentTarget;
    copyTextToClipboard(text, btn);
}

function copyLink(event) {
    const btn = event.currentTarget;
    copyTextToClipboard(window.location.href, btn);
}
