class DataSection {
    constructor() {
        this.data = [];
    }

    addVariable(identifier, value = 0) {
        this.data.push(`${identifier}: .word ${value}`);
    }

    addString(label, value) {
        this.data.push(`${label}: .asciiz ${value}`);
    }

    getDataSection() {
        return `.data\n${this.data.join('\n')}`;
    }
}

class TextSection {
    constructor() {
        this.instructions = [];
    }

    addInstruction(instruction) {
        this.instructions.push(instruction);
    }

    addLabel(label) {
        this.instructions.push(`${label}:`);
    }

    getTextSection() {
        return `.text\nmain:\n${this.instructions.join('\n')}`;
    }
}

class MIPSGenerator {
    
    constructor(ast) {
        console.log('AST:', ast);
        this.ast = ast;  // Use this.ast instead of this._ast
        this.dataSection = new DataSection();
        this.textSection = new TextSection();
        
    }

    generate() {
        console.log('Starting MIPS code generation...');
        console.log('AST received:', JSON.stringify(this.ast, null, 2)); // Log the full AST
        this.ast.forEach(node => {
            console.log('Processing AST Node:', node); // Log each node being processed
            this.handleNode(node);
        });
    }

    handleNode(node) {
        console.log('Handling Node:', node);
        switch (node.type) {
            case 'var_decl':
                console.log(`Declaring variable ${node.identifier} with value ${node.value}`);
                this.dataSection.addVariable(node.identifier, node.value || 0);
                break;
            case 'assignment':
                console.log(`Assigning to variable ${node.identifier} with expression ${node.expression}`);
                this.textSection.addInstruction(`la $t0, ${node.identifier}`);
                this.textSection.addInstruction(`li $t1, ${node.expression}`);
                this.textSection.addInstruction(`sw $t1, ($t0)`);
                break;
            case 'output':
                console.log(`Output message: ${node.message}`);
                const variableRegex = /\{(.*?)\}/;
                let message = node.message;

                const variable = node.message.match(variableRegex)?.[1];  // Extract the variable name (e.g., 'z')
                
                if (variable) {
                    // Look for the variable in the AST
                    let variableValue = null;
                    for (let astNode of this.ast) {  // Use this.ast, not this._ast
                        if (astNode.type === 'var_decl' && astNode.identifier === variable) {
                            // Found the assignment node for this variable
                            variableValue = astNode.value;  // Get the assigned value from the AST
                            break;
                        }
                    }

                    console.log("variable: ", variable); 
                    console.log("variableValue: ", variableValue); 

                    // If the variable is found and has a value, replace it
                    if (variableValue !== null) {
                        // Replace the placeholder {variable} with its value
                        message = node.message.replace(variableRegex, variableValue);

                        // Generate MIPS code to print the value
                        this.textSection.addInstruction(`li $a0, ${variableValue}`);  
                        this.textSection.addInstruction(`li $v0, 1`);                 
                        this.textSection.addInstruction(`syscall`);                  
                    } else {
                        console.error(`Variable '${variable}' not found in AST or has no assigned value.`);
                    }
                } else {
                    // If no variable is found, just print the message as a string
                    this.textSection.addInstruction(`li $v0, 4`);  
                    this.textSection.addInstruction(`la $a0, message`);  
                    this.textSection.addInstruction(`syscall`);  
                }

                console.log("kaabot na ariii"); 

                // Push the processed output message into the AST
                this.ast.push({ type: "output", message: message });

                // this._statements.push(line);
                break;
            default:
                console.error('Unknown AST node:', node);
        }
        console.log('handleNode');
    }

    // getFullCode() {
    //     return `${this.dataSection.getDataSection()}\n\n${this.textSection.getTextSection()}`;
    // }
    getFullCode() {
        const dataSection = this.dataSection.getDataSection();
        const textSection = this.textSection.getTextSection();
        const fullCode = `${dataSection}\n\n${textSection}`;
        console.log('Generated MIPS Code:\n', fullCode); // Log the final MIPS code
        return fullCode;
    }
}

console.log('Exporting MIPSGenerator:', MIPSGenerator);
module.exports = MIPSGenerator;
