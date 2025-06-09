function setButtonCopied(btn, originalText) {
    btn.dataset.originalText = btn.innerText;
    btn.innerText = '¡Copiado!';
    btn.disabled = true;
    setTimeout(function() {
        btn.innerText = originalText;
        btn.disabled = false;
    }, 1500);
}

function copiarTexto(texto, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto)
            .then(function () {
                setButtonCopied(btn, btn.dataset.originalText || btn.innerText);
            })
            .catch(function (err) {
                console.log('Fallo Clipboard API, usando fallback:', err);
                fallbackCopyTextToClipboard(texto, btn);
            });
    } else {
        console.log('Clipboard API no disponible, usando fallback.');
        fallbackCopyTextToClipboard(texto, btn);
    }
}

function fallbackCopyTextToClipboard(texto, btn) {
    const textArea = document.createElement("textarea");
    textArea.value = texto;
    textArea.style.position = 'fixed';
    textArea.style.top = '-1000px';
    textArea.style.left = '-1000px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        var successful = document.execCommand('copy');
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

function copiarConFecha(event) {
    const texto = `link recuperado el día ${new Date().toLocaleString('es-ES')}: ${window.location.href}`;
    const btn = event.currentTarget;
    copiarTexto(texto, btn);
}

function copiarEnlace(event) {
    const btn = event.currentTarget;
    copiarTexto(window.location.href, btn);
}
