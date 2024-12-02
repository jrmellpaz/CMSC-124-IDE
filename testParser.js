const decType = Object.freeze({
    VARIABLE: 0,
    CONDITION: 1,
    LOOP: 2
});

const dataType = Object.freeze({
    INTEGER: 0,
    FLOAT: 1,
    STRING: 2,
    BOOLEAN: 3,
    VOID: 4,
});

class Declaration {
    constructor(type) {
        this.data = null;

        if (type === decType.VARIABLE) {
            // Values
            this.state = 0;
            this.finalState = 7;
            this.declarationType = type;

            this.table = [
                [1, 8, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],    // State 0
                [8, 8, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],    // State 1
                [8, 3, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],    // State 2
                [8, 8, 4, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],    // State 3
                [8, 8, 4, 5, 8, 5, 5, 8, 8, 8, 8, 8, 8],    // State 4
                [8, 8, 5, 8, 6, 8, 8, 4, 7, 8, 8, 8, 8],    // State 5
                [8, 8, 6, 5, 8, 5, 5, 8, 8, 8, 8, 8, 8],    // State 6
                [1, 8, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],    // State 7
                [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],    // State 8
            ];
        }
    }

    parse(line) {
        const tokens = [];
        let token = null;

        for (let i = 0; i < line.length; i++) {
            const x = line[i];
            if (x === "," || x === ";" || x === "(" || x === ")" || x === '=' || x === " ") {
                if (token !== null) {
                    tokens.push(token);
                    token = null;
                }
            }
            else {
                token += x;
            }
        }

        if (token !== null) {
            tokens.push(token);
        }

        return tokens;
    }

    isIdentifier(token, equal, variableNames) {
        if ()
    }

    getType(token, equal, variableNames) {
        if (
            token === "var" && this.declarationType === decType.variable || 
            token === "cond" && this.declarationType === decType.CONDITION || 
            token === "loop" && this.declarationType === decType.LOOP
        ) {
            return 0;
        }
        else if (token === "int" || token === "float" || token === "string" || token === "bool") {
            if (token === "int") {
                this.data = dataType.INTEGER;
            }
            else if (token === "float") {
                this.data = dataType.FLOAT;
            }
            else if (token === "string") {
                this.data = dataType.STRING;
            }
            else if (token === "bool") {
                this.data = dataType.BOOLEAN;
            }
            else if (token === "void") {
                this.data = dataType.VOID;
            }

            return 1;
        }
        else if (token === " ") {
            return 2;
        }
        else if (isIdentifier(token, equal, variableNames)) {
            return 3;
        }
    }

    isAccepted(tokens) {
        const variableNames = [];
        let equal = false;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const type = getType(token, equal, variableNames);

        
        }
    }
}