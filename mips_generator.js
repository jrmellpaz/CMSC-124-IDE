class MIPSGenerator {
    constructor(statements) {
        this.statements = statements;
        this.code = "";
        this.dataSection = "";

        this.registers = {};
        this.registerCount = 0;

        this.floatRegisters = {};
        this.floatRegisterCount = 0;
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
        if (statement.dataType === "int") {
            const register = `$t${this.registerCount++}`;
            this.registers[identifier] = register;

            this.code += `li ${register}, ${statement.value}\n`;
        }
        else if (statement.dataType === "float") {
            const register = `$f${this.floatRegisterCount++}`;
            this.floatRegisters[identifier] = register;

            this.code += `li.s ${register}, ${statement.value}\n`;
        }
        else if (statement.dataType === "string") {
            this.dataSection += `${identifier}: .asciiz ${statement.value}\n`;
        }
    }

    handleAssignment(statement, identifier) {
        if (statement.dataType === "int") {
            const register = this.registers[identifier];
            this.code += `li ${register}, ${statement.value}\n`;
        }
        else if (statement.dataType === "float") {
            const register = this.floatRegisters[identifier];
            this.code += `li.s ${register}, ${statement.value}\n`;
        }
        else if (statement.dataType === "string") {
            this.dataSection += `${identifier}: .asciiz ${statement.value}\n`;
        }
    }

    handleOutput(statement, identifier) {
        let message = statement.message.replace(/^"|"$/g, '');
        console.log("message: ", message);
        this.dataSection += `${identifier}: .asciiz "${message}"\n`;

        this.code += `la $a0, ${identifier}\n`;
        this.code += `li $v0 4\n`;
        this.code += `syscall\n`;
    }
}

module.exports = MIPSGenerator;