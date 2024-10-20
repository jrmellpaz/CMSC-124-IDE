const { ipcRenderer, clipboard } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
    const elements = {
        title: document.querySelector('[document-name]'),
        open: document.querySelector('[open]'),
        create: document.querySelector('[create]'),
        cut: document.querySelector('[cut]'),
        copy: document.querySelector('[copy]'),
        paste: document.querySelector('[paste]'),
        fileTextarea: document.querySelector('[fileTextarea]'),
        footerArea: document.querySelector('[footer-area]'),
        errorsChip: document.querySelector('[errors-chip]'),
        linesChip: document.querySelector('[lines-chip]'),
    };

    // Creating a new file
    elements.create.addEventListener("click", () => {
        ipcRenderer.send("create-document-triggered");
    });

    ipcRenderer.on("document-created", (_, filePath) => {
        elements.title.innerHTML = filePath.replace(/^.*[\\/]/, '');
        elements.title.style.fontStyle = "normal";
        elements.fileTextarea.removeAttribute("disabled");
        elements.fileTextarea.placeholder = "Start writing your code...";
        elements.fileTextarea.focus();
        elements.footerArea.style.display = "flex";
    });

    // Opening an existing file

    // Cut text in textarea
    elements.cut.addEventListener("click", () => {
        const { value, selectionStart, selectionEnd } = elements.fileTextarea;
        const beforeSelection = value.substring(0, selectionStart);
        const selection = value.substring(selectionStart, selectionEnd);
        const afterSelection = value.substring(selectionEnd);
        const newValue = beforeSelection + afterSelection;
        elements.fileTextarea.value = newValue;
        clipboard.writeText(selection);
        elements.fileTextarea.focus();
        elements.fileTextarea.selectionStart = elements.fileTextarea.selectionEnd = selectionEnd - (selectionEnd - selectionStart);
    });

    // Copy text in textarea 
    elements.copy.addEventListener("click", () => {
        const { value, selectionStart, selectionEnd } = elements.fileTextarea;
        const selection = value.substring(selectionStart, selectionEnd);
        clipboard.writeText(selection);
        elements.fileTextarea.focus();
        elements.fileTextarea.selectionStart = elements.fileTextarea.selectionEnd = selectionEnd;
    });

    // Paste text in textarea
    elements.paste.addEventListener("click", () => {
        const { value, selectionStart, selectionEnd } = elements.fileTextarea;
        const beforeSelection = value.substring(0, selectionStart);
        const afterSelection = value.substring(selectionEnd);
        const pastedValue = clipboard.readText();
        const newValue = beforeSelection + pastedValue + afterSelection;
        elements.fileTextarea.value = newValue;
        elements.fileTextarea.focus();
        elements.fileTextarea.selectionStart = elements.fileTextarea.selectionEnd = selectionEnd - (selectionEnd - selectionStart) + pastedValue.length;
    });
});