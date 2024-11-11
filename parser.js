export class RobasParser {
    constructor() {
      this.symbolTable = {};
    }
  
    // Regular expression for matching "var <data type> <identifier>"
    parseVariableDeclaration(line) {
        // Match "var <data type> <identifier>, <identifier> = <literal>;"
        const varDeclRegex = /var\s+([a-zA-Z_]\w*)\s+([a-zA-Z_]\w*(?:\s*=\s*[^,;]+)?(?:\s*,\s*[a-zA-Z_]\w*(?:\s*=\s*[^,;]+)?)*)\s*;/;
  
        const match = line.match(varDeclRegex);
        if (!match) {
            throw new Error("Invalid syntax for variable declaration.");
        }
  
        const dataType = match[1]; // e.g., int, float, string, bool
        const declarations = match[2].split(/\s*,\s*/); // Split multiple variable declarations
  
        declarations.forEach(declaration => {
            const [identifier, literal] = declaration.split(/\s*=\s*/);
    
            // Validate identifier syntax
            if (!this.isValidIdentifier(identifier)) {
                throw new Error(`Invalid identifier name: '${identifier}'. Identifiers must start with a letter or underscore, followed by letters, digits, or underscores.`);
            }
    
            if (this.symbolTable[identifier]) {
                throw new Error(`Variable '${identifier}' is already declared.`);
            }
    
            // If literal exists, check if it matches the data type
            const value = literal ? this.parseLiteral(literal, dataType) : null;
    
            // Store variable in the symbol table with or without assignment
            this.symbolTable[identifier] = {
                dataType: dataType,
                value: value
            };
        });
    }
  
    // Helper function to check if an identifier is valid
    isValidIdentifier(identifier) {
        const identifierRegex = /^[a-zA-Z_]\w*$/;
        return identifierRegex.test(identifier);
    }
  
    // Helper function to parse literals with type checking
    parseLiteral(literal, dataType) {
        literal = literal.trim();
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
  
    // Main function to parse the code
    parse(code) {
        const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
        lines.forEach(line => {
            this.parseVariableDeclaration(line);
        });
    
        console.log(this.symbolTable);
    }
}