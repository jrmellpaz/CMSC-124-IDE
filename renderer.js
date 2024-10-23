const { ipcRenderer, clipboard, contextBridge } = require("electron");
const path = require("path");       
const UndoRedojs = require("undoredo.js");

window.addEventListener("DOMContentLoaded", () => {
    let settingsData;

    const elements = {
        title: document.querySelector('[document-name]'),
        open: document.querySelector('[open]'),
        create: document.querySelector('[create]'),
        cut: document.querySelector('[cut]'),
        copy: document.querySelector('[copy]'),
        paste: document.querySelector('[paste]'),
        undo: document.querySelector('[undo]'),
        redo: document.querySelector('[redo]'),
        settings: document.querySelector('[settings]'),
        saveAs: document.querySelector('[save-as]'),
        save: document.querySelector('[save]'),
        fileTextarea: document.querySelector('[fileTextarea]'),
        footerArea: document.querySelector('[footer-area]'),
        errorsChip: document.querySelector('[errors-chip]'),
        linesChip: document.querySelector('[lines-chip]'),
        settingsModal: document.querySelector('[settings-modal]'),
        closeButton: document.querySelector('[settings-close]'),
        autoSave: document.querySelector('[auto-save-toggle]'),
    };

    const handleDocumentChange = (filePath, content = "") => {
        // elements.title.innerHTML = filePath.replace(/^.*[\\/]/, '');
        elements.title.value = path.parse(filePath).base;
        elements.title.style.fontStyle = "normal";
        elements.fileTextarea.removeAttribute("disabled");
        elements.fileTextarea.value = content;
        elements.fileTextarea.placeholder = "Start writing your code...";
        elements.fileTextarea.focus();
        elements.footerArea.style.display = "flex";
    };

    // Saving file
    elements.save.addEventListener("click", () => {
        ipcRenderer.send("file-content-updated", elements.fileTextarea.value);
    });

    // Retrieve data
    ipcRenderer.on("read-data", (_, data) => {
        settingsData = data;
        elements.autoSave.checked = (settingsData.preferences.autoSave === "false") ? false : true;
    });

    // Save user data before closing app
    ipcRenderer.on("save-user-data", () => {
        settingsData.preferences.autoSave = (elements.autoSave.checked === true) ? "true" : "false";
        ipcRenderer.send("close-app", settingsData);
    });

    // Update file content automatically when autosave is enabled in settings
    elements.fileTextarea.addEventListener("input", (e) => {
        if(elements.autoSave.checked) {
            ipcRenderer.send("file-content-updated", e.target.value);
        }
    });

    // Creating a new file
    elements.create.addEventListener("click", () => {
        ipcRenderer.send("create-document-triggered");
    });

    ipcRenderer.on("document-created", (_, filePath) => {
        handleDocumentChange(filePath);
    });

    // Opening an existing file
    elements.open.addEventListener("click", () => {
        ipcRenderer.send("open-document-triggered");
    });

    ipcRenderer.on("document-opened", (_, { filePath, content }) => {
        handleDocumentChange(filePath, content);
    });

    // Saving a file as new file
    elements.saveAs.addEventListener("click", () => {
        ipcRenderer.send("save-document-triggered", elements.fileTextarea.value);
    });

    window.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            ipcRenderer.send("save-document-triggered");
        }
    });
    
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

    // Record changes made in textarea in a stack
    const editorHistory = new UndoRedojs(5); // 5 seconds delay every record

    elements.fileTextarea.addEventListener("input", () => {
        if (editorHistory.current() !== elements.fileTextarea.value) {
            // Force record for pastes and auto corrects
            if ((elements.fileTextarea.length - editorHistory.current().length) > 1 ||
            (elements.fileTextarea.value.length - editorHistory.current().length) < -1 ||
            (elements.fileTextarea.value.length - editorHistory.current().length) === 0) {
                editorHistory.record(elements.fileTextarea.value, true);
            }
            else {
                editorHistory.record(elements.fileTextarea.value);
            }
        }
    });

    // Undoing changes in textarea
    const undoChanges = () => {
        if (editorHistory.undo(true) !== undefined) {
            elements.fileTextarea.value = editorHistory.undo();
        }
    };

    // Clicking the button
    elements.undo.addEventListener("click", undoChanges);
    // Pressing Ctrl+Z
    elements.fileTextarea.addEventListener("keydown", event => {
        if (event.ctrlKey && event.keyCode === 90) {
            undoChanges();
        }
    });

    // Redoing changes in textarea
    const redoChanges = () => {
        if (editorHistory.redo(true) !== undefined) {
            elements.fileTextarea.value = editorHistory.redo();
        }
    };

    // Clicking the button
    elements.redo.addEventListener("click", redoChanges);
    // Pressing Ctrl+Y
    elements.fileTextarea.addEventListener("keydown", event => {
        if (event.ctrlKey && event.keyCode === 89) {
            redoChanges();
        }
    });

    // Settings modal
    const closeModal = () => {
        const modal = elements.settingsModal;

        if(modal.open) {
            modal.classList.add("closePopup");
            modal.addEventListener("animationend", () => {
                modal.classList.remove("closePopup");
                modal.close();
            }, {once : true});
        }
    };

    // Open up settings modal
    elements.settings.addEventListener("click", () => {
        elements.settingsModal.showModal();
    });
    // Close down settings modal
    elements.closeButton.addEventListener("click", closeModal);
    elements.settingsModal.addEventListener("click", event => {
        const dimensions = elements.settingsModal.getBoundingClientRect();
    
        if(
            event.clientX < dimensions.left ||
            event.clientX > dimensions.right ||
            event.clientY < dimensions.top ||
            event.clientY > dimensions.bottom
        ) {
            elements.settingsModal.classList.add("closePopup");
      
            elements.settingsModal.addEventListener("animationend", () => {
                elements.settingsModal.classList.remove("closePopup");
                elements.settingsModal.close();
            }, {once: true});
        }
    });
});