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

// Counting the number of lines in the textarea
const linesChip = document.querySelector('[lines-chip]');
["mouseup", "keyup"].forEach(e => textarea.addEventListener(e, () => {
    let numberOfLines = 0;
    if(textarea.value !== "") {
        let style = (window.getComputedStyle) ? window.getComputedStyle(textarea) : textarea.currentStyle;
        let taLineHeight = parseInt(style.lineHeight, 10);
        let calculateContentHeight = (taLineHeight => {
            let origHeight = textarea.style.height;
            let height = textarea.offsetHeight;
            let scrollHeight = textarea.scrollHeight;
            let overflow = textarea.style.overflow;

            if(height >= scrollHeight) {
                textarea.style.height = (height + taLineHeight) + "px";
                textarea.style.overflow = "hidden";

                if(scrollHeight < textarea.scrollHeight) {
                    while(textarea.offsetHeight >= textarea.scrollHeight) {
                        textarea.style.height = (height -= taLineHeight) + "px";
                    }

                    while(textarea.offsetHeight < textarea.scrollHeight) {
                        textarea.style.height = (height++) + "px";
                    }

                    textarea.style.height = origHeight;
                    textarea.style.overflow = overflow;
                    return height;
                }
            }
            else {
                return scrollHeight;
            }
        });
        let taHeight = calculateContentHeight(taLineHeight);
        console.log("taHeight", taHeight);
        numberOfLines = Math.ceil(taHeight / taLineHeight) - 3;
    }

    linesChip.innerHTML = numberOfLines + " lines"; 
}));