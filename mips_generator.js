class MIPSGenerator {
    constructor(statements) {
        this.statements = statements;
        this.code = "";
        this.dataSection = "";
        this.registers = {};
        this.registerCount = 0;
    }

    generateMIPS() {
        for (const identifier in this.statements) {
            const statement = this.statements[identifier];

            switch (statement.type) {
                case "var":
                    this.handleVariable(statement, identifier);
                    break;
                case "assignment":
                    this.handleAssignment(statement, identifier);
                    break;
                case "output":
                    this.handleOutput(statement, identifier);
                    break;
            }
        }

        return `.data\n${this.dataSection}\n.text\n${this.code}`;
    }

    handleVariable(statement, identifier) {
        const register = `$t${this.registerCount++}`;
        this.registers[identifier] = register;

        if (statement.dataType === "int") {
            this.code += `li ${register}, ${statement.value}\n`;
        }
    }

    handleAssignment(statement, identifier) {
        const register = this.registers[identifier];

        if (statement.dataType === "int") {
            this.code += `li ${register}, ${statement.value}\n`;
        }
    }

    handleOutput(statement, identifier) {
        const outputParts = statement.message.match(/{(.*?)}/g) || [];
        let message = statement.message;

        for (const part of outputParts) {
            const varName = part.replace(/[{}]/g, '');
            const register = this.registers[varName];

            if (register) {
                message = message.replace(part, `\" + $${register} + \"`);
            }
        }

        this.dataSection += `${identifier}: .asciiz "${message}"\n`;

        this.code += this.convertMessageToMips(message, identifier);
    }

    convertMessageToMips(message, identifier) {
        let mips = "";
        const parts = message.split(/([{}])/);
        
        parts.forEach(part => {
            if (part.startsWith("{") && part.endsWith("}")) {
                const varName = part.slice(1, -1);
                const register = this.registers[varName];

                if (register) {
                    mips += `move $a0, ${register}\nli $v0, 1\nsyscall\n`;
                }
            }
            else if (part.trim()) {
                mips += `la $a0, ${identifier}\nli $v0, 4\nsyscall`;
            }
        });

        return mips;
    }
}

module.exports = MIPSGenerator;

// class DataSection {
//     constructor() {
//         this.data = [];
//     }

//     addVariable(identifier, value = 0) {
//         this.data.push(`${identifier}: .word ${value}`);
//     }

//     addString(label, value) {
//         this.data.push(`${label}: .asciiz ${value}`);
//     }

//     getDataSection() {
//         return `.data\n${this.data.join('\n')}`;
//     }
// }

// class TextSection {
//     constructor() {
//         this.instructions = [];
//     }

//     addInstruction(instruction) {
//         this.instructions.push(instruction);
//     }

//     addLabel(label) {
//         this.instructions.push(`${label}:`);
//     }

//     getTextSection() {
//         return `.text\nmain:\n${this.instructions.join('\n')}`;
//     }
// }

// class MIPSGenerator {
//     constructor(ast) {
//         console.log('AST:', ast);
//         this.ast = ast;  // Use this.ast instead of this._ast
//         this.dataSection = new DataSection();
//         this.textSection = new TextSection();
        
//     }

//     generate() {
//         console.log('Starting MIPS code generation...');
//         console.log('AST received:', JSON.stringify(this.ast, null, 2)); // Log the full AST
//         this.ast.forEach(node => {
//             console.log('Processing AST Node:', node); // Log each node being processed
//             this.handleNode(node);
//         });
//     }

//     handleNode(node) {
//         console.log('Handling Node:', node);
//         switch (node.type) {
//             case 'var_decl':
//                 console.log(`Declaring variable ${node.identifier} with value ${node.value}`);
//                 this.dataSection.addVariable(node.identifier, node.value || 0);
//                 break;
//             case 'assignment':
//                 console.log(`Assigning to variable ${node.identifier} with expression ${node.expression}`);
//                 this.textSection.addInstruction(`la $t0, ${node.identifier}`);
//                 this.textSection.addInstruction(`li $t1, ${node.expression}`);
//                 this.textSection.addInstruction(`sw $t1, ($t0)`);
//                 break;
//             case 'output':
//                 console.log(`Output message: ${node.message}`);
//                 const variableRegex = /\{(.*?)\}/;
//                 let message = node.message;

//                 const variable = node.message.match(variableRegex)?.[1];  // Extract the variable name (e.g., 'z')
                
//                 if (variable) {
//                     // Look for the variable in the AST
//                     let variableValue = null;
//                     for (let astNode of this.ast) {  // Use this.ast, not this._ast
//                         if (astNode.type === 'var_decl' && astNode.identifier === variable) {
//                             // Found the assignment node for this variable
//                             variableValue = astNode.value;  // Get the assigned value from the AST
//                             break;
//                         }
//                     }

//                     console.log("variable: ", variable); 
//                     console.log("variableValue: ", variableValue); 

//                     // If the variable is found and has a value, replace it
//                     if (variableValue !== null) {
//                         // Replace the placeholder {variable} with its value
//                         message = node.message.replace(variableRegex, variableValue);

//                         // Generate MIPS code to print the value
//                         this.textSection.addInstruction(`li $a0, ${variableValue}`);  
//                         this.textSection.addInstruction(`li $v0, 1`);                 
//                         this.textSection.addInstruction(`syscall`);                  
//                     } else {
//                         console.error(`Variable '${variable}' not found in AST or has no assigned value.`);
//                     }
//                 } else {
//                     // If no variable is found, just print the message as a string
//                     this.textSection.addInstruction(`li $v0, 4`);  
//                     this.textSection.addInstruction(`la $a0, message`);  
//                     this.textSection.addInstruction(`syscall`);  
//                 }

//                 console.log("kaabot na ariii"); 

//                 // Push the processed output message into the AST
//                 this.ast.push({ type: "output", message: message });

//                 // this._statements.push(line);
//                 break;
//             default:
//                 console.error('Unknown AST node:', node);
//         }
//         console.log('handleNode');
//     }

//     // getFullCode() {
//     //     return `${this.dataSection.getDataSection()}\n\n${this.textSection.getTextSection()}`;
//     // }
//     getFullCode() {
//         const dataSection = this.dataSection.getDataSection();
//         const textSection = this.textSection.getTextSection();
//         const fullCode = `${dataSection}\n\n${textSection}`;
//         console.log('Generated MIPS Code:\n', fullCode); // Log the final MIPS code
//         return fullCode;
//     }
// }

// console.log('Exporting MIPSGenerator:', MIPSGenerator);
// module.exports = MIPSGenerator;
