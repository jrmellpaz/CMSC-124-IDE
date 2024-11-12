class RobasParser {
    constructor() {
        this._symbolTable = {};
        this._statements = [];
    }

    get symbolTable() {
        return this._symbolTable;
    }

    get statements() {
        return this._statements;
    }

    // Regular expression for matching "var <data type> <identifier>"
    parseVariableDeclaration(line) {
        // Match "var <data type> <identifier>, <identifier> = <literal>;"
        const varDeclRegex = /var\s+([a-zA-Z_]\w*)\s+([a-zA-Z_]\w*(?:\s*=\s*[^,;]+)?(?:\s*,\s*[a-zA-Z_]\w*(?:\s*=\s*[^,;]+)?)*)\s*;/;
        const match = line.match(varDeclRegex);

        if (match) {
            const dataType = match[1]; // e.g., int, float, string, bool
            const declarations = match[2].split(/\s*,\s*/); // Split multiple variable declarations
            declarations.forEach(declaration => {
                const [identifier, literal] = declaration.split(/\s*=\s*/);

                // Validate identifier syntax
                if (!this.isValidIdentifier(identifier)) {
                    throw new Error(`Invalid identifier name: '${identifier}'.`);
                }
                if (this.symbolTable[identifier]) {
                    throw new Error(`Variable '${identifier}' is already declared.`);
                }

                // If literal exists, check if it matches the data type
                const value = literal ? this.parseLiteral(literal, dataType) : null;
                // Store variable in the symbol table with or without assignment
                this.symbolTable[identifier] = {
                    dataType,
                    value
                };
            });
        }
        else {
            this.parseStatement(line);
        }
    }

    parseStatement(line) {
        const statementRegex = /^([a-zA-Z_]\w*)\s*=\s*(.+)\s*;$/;
        const match = line.match(statementRegex);

        if (!match) {
            throw new Error("Invalid syntax for a statement.");
        }

        const identifier = match[1];
        if (!this._symbolTable[identifier]) {
            throw new Error(`Variable '${identifier}' is not declared.`);
        }

        const expression = match[2];
        const result = this.evaluateExpression(expression, this._symbolTable[identifier].dataType);

        this._symbolTable[identifier].value = result;
        this._statements.push(line);
    }

    // Helper function to check if an identifier is valid
    isValidIdentifier(identifier) {
        const identifierRegex = /^[a-zA-Z_]\w*$/;
        return identifierRegex.test(identifier);
    }

    // Helper function to parse literals with type checking
    parseLiteral(literal, dataType) {
        literal = literal.trim();

        if (this.isArithmeticExpression(literal)) {
            return this.evaluateExpression(literal, dataType);
        }

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
        return /[+\-*/%]|&&|\|\|/.test(expression);
    }

    evaluateExpression(expression, dataType) {
        const sanitizedExpression = expression.replace(/([a-zA-Z_]\w*)|(".*?")/g, (match) => {
            if (/^".*"$/.test(match)) {
                return match;
            }

            if (match === "true" || match === "false") {
                return match;
            }

            if (!this._symbolTable[match]) {
                throw new Error(`Variable '${match}' is not declared.`);
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
            
            throw new Error(`Error: ${result}.`);
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
    // Main function to parse the code
    parse(code) {
        const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        lines.forEach(line => {
            this.parseVariableDeclaration(line);
        });
        console.log("banana", this.symbolTable);
    }
}

module.exports = RobasParser;