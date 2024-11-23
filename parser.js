const { ipcMain, dialog } = require("electron");

class RobasParser {
    constructor(mainWindow) {
        this._symbolTable = {};
        this._statements = [];
        this._conditionalDeclaration = false;
        this._isInConditional = false;
        this._window = mainWindow;
    }

    get symbolTable() {
        return this._symbolTable;
    }

    get statements() {
        return this._statements;
    }

    // Regular expression for matching "var <data type> <identifier>"
    async parseVariableDeclaration(line) {
        // Match "var <data type> <identifier>, <identifier> = <literal>;"
        const varDeclRegex = /var\s+([a-zA-Z_]\w*)\s+([a-zA-Z_]\w*(?:\s*=\s*[^,;]+)?(?:\s*,\s*[a-zA-Z_]\w*(?:\s*=\s*[^,;]+)?)*)\s*;/;
        const match = line.match(varDeclRegex);

        if (match) {
            const dataType = match[1]; // e.g., int, float, string, bool
            const declarations = match[2].split(/\s*,\s*/); // Split multiple variable declarations
            declarations.forEach(async declaration => {
                const [identifier, literal] = declaration.split(/\s*=\s*/);

                // Validate identifier syntax
                if (!this.isValidIdentifier(identifier)) {
                    throw new Error(`Invalid identifier name: '${identifier}'.`);
                }

                // If literal exists, check if it matches the data type
                const value = literal ? await this.parseLiteral(literal, dataType) : null;
                // Store variable in the symbol table with or without assignment

                if (!this._isInConditional && this._symbolTable[identifier] && !this._symbolTable[identifier].conditionalDeclaration) {
                    // console.log(this._symbolTable);
                    throw new Error(`Variable '${identifier}' is already declared: ${line}.`);
                }
                else if (!this._isInConditional && this._symbolTable[identifier] && !this._symbolTable[identifier].conditionalDeclaration) {
                    this._symbolTable[identifier] = {
                        ...this._symbolTable[identifier], 
                        value: literal,
                        conditionalDeclaration: true
                    } 
                }
                else {
                    this._symbolTable[identifier] = {
                        dataType,
                        value,
                        conditionalDeclaration: this._conditionalDeclaration
                    };
                }
            });
        }
        else {
            this.parseStatement(line);
        }
    }

    async parseStatements(lines) {
        console.log("lines here", lines);
        const statements = [];
        let currentStatement = "";
        let braceCount = 0;

        const test = lines.split(/(\n)/);
        console.log("test:", test);
        
        test.forEach(line => {
            line.trim();
            if (!line) {
                return;
            }

            if (line.includes("{")) {
                braceCount++;
                currentStatement += line + " ";
            }
            else if (line.includes("}")) {
                braceCount--;
                currentStatement += line + " ";

                if (braceCount === 0) {
                    statements.push(currentStatement.trim());
                    currentStatement = "";
                }
            }
            else if (braceCount > 0) {
                currentStatement += line + " ";
            }
            else {
                currentStatement += line + " ";
                statements.push(currentStatement.trim());
                currentStatement = "";
            }
        });

        console.log("here!!!!", statements);
        statements.filter(statement => statement.length > 0).forEach(async statement => {
            this._conditionalDeclaration = true;
            await this.parseVariableDeclaration(statement);
        });
    }

    parseStatement(line) {
        console.log("line-----", line);
        const statementRegex = /^([a-zA-Z_]\w*)\s*=\s*(.+)\s*;$/;
        const match = line.match(statementRegex);

        if (!match) {
            throw new Error(`Invalid syntax for statement: '${line}'.`);
        }

        const identifier = match[1];
        // if (!this._symbolTable[identifier]) {
        //     throw new Error(`Variable '${identifier}' is not declared.`);
        // }
        if (
            !this._isInConditional && !this._symbolTable[identifier] && 
            !this._isInConditional && this._symbolTable[identifier] && !this._symbolTable[identifier].conditionalDeclaration
        ) {
            throw new Error(`Variable '${identifier}' is not declared.`);
        }
        console.log("bananananannna");
        const expression = match[2];
        const result = this.evaluateExpression(expression, this._symbolTable[identifier].dataType);

        this._symbolTable[identifier] = {
            ...this._symbolTable[identifier],
            value: result,
            conditionalDeclaration: this._conditionalDeclaration
        }

        this._statements.push(line);
    }

    parseConditionalBlock(lines, currentIndex) {
        let block = "";
        let braceCount = 0;

        for (let i = currentIndex; i < lines.length; i++) {
            let line = lines[i].trim();
            console.log(`Lines: ${lines} \n Line: "${line}", BraceCount: ${braceCount}`);

            if (line.includes("{")) {
                braceCount++;

                if (braceCount === 1) {
                    continue;
                }
            }

            if (line.includes("}")) {
                braceCount--;
                if (braceCount === 0) {
                    // block += line;
                    return { block: block.trim(), nextIndex: i };
                }
            }

            block += line + "\n";
        }

        if (braceCount !== 0) {
            throw new Error("Syntax Error: Missing closing brace '}'.");
        }
        throw new Error("Error parsing block: Unexpected end of input.");
    }

    // Helper function to check if an identifier is valid
    isValidIdentifier(identifier) {
        const identifierRegex = /^[a-zA-Z_]\w*$/;
        return identifierRegex.test(identifier);
    }

    // Helper function to parse literals with type checking
    async parseLiteral(literal, dataType) {
        literal = literal.trim();

        if (this.isArithmeticExpression(literal)) {
            return this.evaluateExpression(literal, dataType);
        }
        else if (this.isInput(literal)) { // input
            try {
                literal = await this.evaluateInput(literal);
                console.log("here??/");
            }
            catch (error) {
                console.log("-------------skbskj");
            }
        }
        // console.log("naa diri", this.isInput(literal));
        // else if (this.isOutput(literal)) {
        //     return this.evaluateExpression(literal, dataType);
        // }

        switch (dataType) {
            case "int":
                if (/^\d+$/.test(literal)) {
                    return parseInt(literal, 10); // Integer literal
                }
                throw new Error(`Invalid assignment: Expected an integer but got '${literal}'.`);
            case "float":
                if (/^\d*\.\d+$/.test(literal)) {
                    return parseFloat(literal); // Float literal
                }
                throw new Error(`Invalid assignment: Expected a float but got '${literal}'.`);
            case "string":
                if (/^".*"$/.test(literal)) {
                    return literal.slice(1, -1); // String literal, remove the surrounding quotes
                }
                throw new Error(`Invalid assignment: Expected a string but got '${literal}'.`);
            case "bool":
                if (literal === "true" || literal === "false") {
                    return literal === "true"; // Return a boolean value
                }
                throw new Error(`Invalid assignment: Expected a boolean (true/false) but got '${literal}'.`);
            default:
                throw new Error(`Unknown data type: ${dataType}`);
        }
    }

    isArithmeticExpression(expression) {
        console.log("exp", expression);
        return /[+\-*/%]|&&|\|\|/.test(expression);
    }

    isInput(expression) {
        return /^\s*input\s*:\s*"(.*)"\s*$/.test(expression);
    }

    // isOutput(expression) {
    //     return;
    // }

    evaluateExpression(expression, dataType) {
        const sanitizedExpression = expression.replace(/([a-zA-Z_]\w*)|(".*?")/g, (match) => {
            if (/^".*"$/.test(match)) {
                return match;
            }

            if (match === "true" || match === "false") {
                return match;
            }

            // if (!this._symbolTable[match]) {
            //     throw new Error(`Variable '${match}' is not declared.`);
            // }
            if (this._symbolTable[match]) {
                return this._symbolTable[match].value;
            }

            const value = this._symbolTable[match].value;
            if (
                typeof value === "number" && (dataType === "int" || dataType === "float") || 
                typeof value === "boolean" && dataType === "bool"
            ) {
                return value.toString();
            }
            else if (dataType === "string") {
                return `"${value}"`;
            }
            
            throw new Error(`Error evaluating expression: ${match}.`);
        });

        let result;

        try {
            result = eval(sanitizedExpression);
        }
        catch (error) {
            throw new Error(`Error evaluating expression: ${expression}.`);
        }

        if (dataType === "int" || dataType === "float") {
            if (typeof result !== "number") {
                throw new Error(`Expected numeric result but got '${result}'.`);
            }
        }
        else if (dataType === "string") {
            if (typeof result !== "string") {
                throw new Error(`Expected string result but got '${result}'.`);
            }
        }
        else if (dataType === "bool") {
            if (typeof result !== "boolean") {
                throw new Error(`Expected boolean result but got '${result}'.`);
            }
        }

        return result;
    }

    async evaluateInput(input) {
        const inputRegex = /^\s*input\s*:\s*"(.*)"\s*$/;
        const match = input.match(inputRegex);

        if (!match[1]) {
            throw new Error("Error in extracting message in input.");
        }

        // const response = window.prompt(match[1]);
        // this._window.webContents.send("prompt-opened", match[1]);
        // ipcMain.on("prompt-closed", (_, res) => {
        //     return res;
        // })
        // return response;

        let response; 
        
        // dialog.showMessageBox(this._window, {
        //     type: 'question',
        //     buttons: ['OK', 'Cancel'],
        //     title: 'Input Needed',
        //     message: match[1],
        //     detail: 'This is your message prompt from the main process.',
        //     noLink: true
        // }).then(box => response = box.response).catch(error => {throw new Error(`Error here: ${error}`)});

        const prompt = require("electron-prompt");

        prompt({
            title: 'Prompt example',
            label: 'URL:',
            value: 'http://example.org',
            inputAttrs: {
                type: 'text'
            },
            type: 'input'
        })
        .then((r) => {
            if(r === null) {
                console.log('user cancelled');
            } else {
                console.log('result', r);
                response = r;
                return response;
            }
        })
        .catch(console.error);

        // prompt({
        //     title: "Input",
        //     label: match[1],
        //     type: "input",
        //     inputAttrs: {
        //         type: "text",
        //         required: true
        //     },
        //     height: 200,
        //     alwaysOnTop: true
        // }).then((result) => {
        //     // if (r === null) {
        //     //     throw new Error("Input is required to proceed.");
        //     // }

        //     response = result;
        // }).catch((error) => {
        //     throw new Error(`Error occured during input: ${error}`);
        // });

        // console.log("res hereee", response);
    }

    // Main function to parse the code
    async parse(code) {
        const lines = code.map(line => line.trim()).filter(line => line.length > 0);
        let enteredIf = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            console.log("i:", i, "line:", line);

            const conditionalRegex = /^(if|else\s*if)\s*:\s*(.*)\s*{$|^(else)\s*{$/;
            const match = line.match(conditionalRegex);
            console.log(match);

            if (match) {
                this._isInConditional = true;
                const keyword = match[1] ?? match[3];
                console.log("keyword", keyword);
                const condition = match[2]?.trim();

                const { block, nextIndex } = this.parseConditionalBlock(lines, i);

                i = nextIndex;
                console.log("huhuhuhu");

                if (keyword === "else") {
                    if(enteredIf) {
                        continue;
                    }

                    console.log("blockElse:", block);
                    await this.parseStatements(block);
                    enteredIf = false;
                }
                else {
                    enteredIf = false;
                    const isConditionTrue = this.evaluateExpression(condition, "bool");
                    if (isConditionTrue) {
                        enteredIf = true;
                        await this.parseStatements(block);
                    }
                }

                this._isInConditional = false;
                this._conditionalDeclaration = false;
            }
            else {
                await this.parseVariableDeclaration(line);
            }
        }

        console.log(this.symbolTable);

        // lines.forEach(line => {
        //     this.parseVariableDeclaration(line);
        // });
    }
}

module.exports = RobasParser;