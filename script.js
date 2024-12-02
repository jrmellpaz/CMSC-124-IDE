const textarea = document.querySelector("textarea");
const terminalTextarea = document.querySelector('[terminal-textarea]');

// Indentation
const editorIndentSpaces = 1;
const indent = "\t".repeat(editorIndentSpaces);
const unIndentPattern = new RegExp(`^\t{${editorIndentSpaces}}`);

[textarea, terminalTextarea].forEach(textarea => textarea.addEventListener("keydown", ev => {
    const textarea = ev.target;
    const v = textarea.value;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;

    if (ev.key === "Tab") {
        ev.preventDefault(); // Stop the focus from changing
        const isUnIndenting = ev.shiftKey;

        if (startPos === endPos) {
            // Nothing selected, just indent/unindent where the cursor is
            let newCursorPos;
            const lineStartPos = v.slice(0, startPos).lastIndexOf("\n") + 1;
            const lineEndPos = v.slice(lineStartPos, v.length).indexOf("/n");

            if (isUnIndenting) {
                const newLineContent = v.slice(lineStartPos, lineEndPos).replace(unIndentPattern, "");
                textarea.value = v.slice(0, lineStartPos) + newLineContent + v.slice(lineEndPos);
                newCursorPos = Math.max(startPos - editorIndentSpaces, lineStartPos);
            } 
            else {
                textarea.value = v.slice(0, lineStartPos) + indent + v.slice(lineStartPos);
                newCursorPos = startPos + editorIndentSpaces;
            }
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        } 
        else {
            // Indent/unindent the selected text
            const lineStartPos = v.slice(0, startPos).lastIndexOf("\n") + 1;
            const selection = v.substring(lineStartPos, endPos);
            let result = "";
            const lines = selection.split("\n");

            for (let i = 0; i < lines.length; i++) {
                if (isUnIndenting) {
                    // Unindent selected lines
                    result += lines[i].replace(unIndentPattern, "");
                } 
                else {
                    // Indent selected lines
                    result += indent + lines[i];
                }

                if (i < lines.length - 1) {
                    //add line breaks after all but the last line
                    result += "\n";
                }
            }

            textarea.value = v.split(selection).join(result);
            if (isUnIndenting) {
                textarea.setSelectionRange(
                    Math.max(startPos - editorIndentSpaces, lineStartPos),
                    lineStartPos + result.length
                );
            } 
            else {
                textarea.setSelectionRange(
                    startPos + editorIndentSpaces,
                    lineStartPos + result.length
                );
            }
        }
    } 
    else if (ev.key === "Enter") {
        //When enter is pressed, maintain the current indentation level

        //We will place the newline character manually, this stops it from being typed
        ev.preventDefault();

        //Get the current indentation level and prefix the new line with the same
        const prevLinePos = v.slice(0, startPos).lastIndexOf("\n") + 1;
        const prevLine = v.slice(prevLinePos, endPos);
        const levels = prevLine.match(/^\t*/)[0].length / editorIndentSpaces;
        const indentation = indent.repeat(levels);
        textarea.value = v.slice(0, endPos) + "\n" + indentation + v.slice(endPos);

        //Set the cursor position
        const newCursorPos = endPos + 1 + indentation.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
    }
}));

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
        numberOfLines = Math.floor(taHeight / taLineHeight)-3;
    }

    linesChip.innerHTML = numberOfLines + " lines"; 
}));

// Expand input text box based on value of length
const documentTitle = document.querySelector('[document-name]');

["hover", "focus", "input"].forEach(e => documentTitle.addEventListener(e, () => {
    documentTitle.style.fontStyle = documentTitle.value.length === 0 ? "italic" : "normal";
    documentTitle.style.width = documentTitle.value.length === 0 ? "1ch" : (documentTitle.value.length / 1.1) + "ch";
    documentTitle.placeholder = "";
}));

documentTitle.addEventListener("blur", () => {
    documentTitle.style.width = documentTitle.value.length === 0 ? "15ch" : documentTitle.style.width;
    documentTitle.placeholder = "Untitled document";
});

// Close terminal
const terminalWindow = document.querySelector('[terminal]');
const closeTerminalButton = document.querySelector('[close-terminal]');
const terminalButton = document.querySelector('[terminal-button]');

closeTerminalButton.addEventListener("click", () => {
    terminalWindow.style.display = "none";
});

terminalButton.addEventListener("click", () => {
    terminalWindow.style.display = terminalWindow.style.display === "flex" ? "none" : "flex";
});