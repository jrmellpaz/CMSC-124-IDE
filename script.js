// Inserting tab in editor
const textarea = document.querySelector("textarea");

const insertTabCharacter = () => {
    const { value, selectionStart, selectionEnd } = textarea;

    // Insert tab character
    textarea.value = `${value.substring(0, selectionEnd)}\t${value.substring(selectionEnd)}`;

    // Update cursor position
    textarea.selectionStart = textarea.selectionEnd = selectionEnd + 1;
};

textarea.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
        e.preventDefault();
        insertTabCharacter();
    }
});