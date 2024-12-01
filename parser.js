const { ipcMain, dialog } = require("electron"); //lines are passed here
const betterPrompt = require("electron-prompt");

class RobasParser {
    constructor(mainWindow) {
        this._symbolTable = {}; //table
        this._statements = []; //array
        this._ast = [];
        this._conditionalDeclaration = false;
        this._isInConditional = false;
        this._window = mainWindow;
    }

    get ast() {
        return this._ast;
    }


    get symbolTable() { 
        return this._symbolTable;
    }

    get statements() {
        return this._statements;
    }

    async parseVariableDeclaration(line) {
        const varDeclRegex = /var\s+([a-zA-Z_]\w*)\s+([a-zA-Z_]\w*(?:\s*=\s*[^,;]+)?(?:\s*,\s*[a-zA-Z_]\w*(?:\s*=\s*[^,;]+)?)*)\s*;/;
        const match = line.match(varDeclRegex);

        console.log("match po: ", match)
        if (match) {
            const dataType = match[1];
            const declarations = match[2].split(/\s*,\s*/);

            for (const declaration of declarations) {
                const [identifier, literal] = declaration.split(/\s*=\s*/);

                const value = literal ? await this.parseLiteral(literal, dataType) : null;
                console.log("value is: ", value)
                this._ast.push({
                    type: "var_decl",
                    dataType,
                    identifier,
                    value,
                });

                this._symbolTable[identifier] = { dataType, value };
                this._statements.push(line);
            }
        } else {
            await this.parseStatement(line);
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

    async parseStatement(line) {
        console.log("line code: ", line); 
        if (this.isOutput(line)) {
            const outputRegex = /^output:\s*"(.*)";$/;
            const match = line.match(outputRegex);
            const message = match[1];

            this._ast.push({ type: "output", message });

            this._statements.push(line);
        } else {
            const statementRegex = /^([a-zA-Z_]\w*)\s*=\s*(.+)\s*;$/;
            const match = line.match(statementRegex);

            if (match) {
                const identifier = match[1];
                const expression = match[2];
                const value = this.evaluateExpression(expression, this._symbolTable[identifier].dataType);

                this._ast.push({ type: "assignment", identifier, expression });

                this._symbolTable[identifier].value = value;
                this._statements.push(line);
            }
        }
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
            console.log("arithmetic"); 
            return this.evaluateExpression(literal, dataType);
        }
        else if (this.isInput(literal)) { // input
            try {
                literal = await this.evaluateInput(literal);
            }
            catch (error) {
                console.log("Error in input:", error);
            }
        }

        console.log("niproceed ://", literal);

        switch (dataType) {
            case "int":
                if (/^-?\d+$/.test(literal)) {
                    return parseInt(literal, 10); // Integer literal
                }
                throw new Error(`Invalid assignment: Expected an integer but got '${literal}'.`);
            case "float":
                if (/^-?\d*(\.\d+)?$/.test(literal)) {
                    return parseFloat(literal); // Float literal
                }
                throw new Error(`Invalid assignment: Expected a float but got '${literal}'.`);
            case "string":
                literal = "\"" + literal + "\""; 
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
        return /[+\-*/%]|&&|\|\|/.test(expression);
    }

    isInput(expression) {
        return /^\s*input\s*:\s*"(.*)"\s*$/.test(expression);
    }

    isOutput(expression) {
        return /^output:\s*"(.*)";$/.test(expression);
    }

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
            result = eval(sanitizedExpression); // Evaluate the arithmetic expression, this is where the operataion
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

        let message = match[1];

        message = message.replace(/\{([a-zA-Z_]\w*)\}/g, (match, identifier) => {
            if (!this._symbolTable[identifier]) {
                throw new Error(`Variable '${identifier}' is not declared.`);
            }

            console.log("identifier", identifier, "\n", this._symbolTable[identifier]);

            return this._symbolTable[identifier].value;
        });

        const result = await betterPrompt({
            title: 'Input needed',
            label: message,
            type: 'input',
            height: 200,
            icon: "assets/icon.png",
            alwaysOnTop: true,
            customStylesheet: "prompt.css",
        }, this._window);

        return result;
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
                console.log("here po")
                await this.parseVariableDeclaration(line);
            }

            console.log("nahuman :(((")
        }

        console.log("table:", this.symbolTable);
        console.log("statements:", this.statements);
    }
}

module.exports = RobasParser;
