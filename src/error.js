
export class UsageError extends Error {
    
}

export class CompilerError extends Error {
    
    constructor(message, ostraCodeFile = null, lineNum = null) {
        super(message);
        this.ostraCodeFile = ostraCodeFile;
        this.lineNum = lineNum;
    }
    
    getLabel() {
        const components = ["Error"];
        if (this.lineNum !== null) {
            components.push(" on line " + this.lineNum);
        }
        if (this.ostraCodeFile !== null) {
            if (this.lineNum === null) {
                components.push(" in ");
            } else {
                components.push(" of ");
            }
            components.push(this.ostraCodeFile.srcPath);
        }
        return components.join("");
    }
}

export class CompilerErrorThrower {
    // Concrete subclasses of CompilerErrorThrower must implement these methods:
    // getOstraCodeFile, getLineNum
    
    throwError(message) {
        throw new CompilerError(message, this.getOstraCodeFile(), this.getLineNum());
    }
    
    tryOperation(operation) {
        let output;
        try {
            output = operation();
        } catch (error) {
            if (error instanceof CompilerError) {
                if (error.ostraCodeFile === null) {
                    error.ostraCodeFile = this.getOstraCodeFile();
                }
                if (error.lineNum === null) {
                    error.lineNum = this.getLineNum();
                }
            }
            throw error;
        }
        return output;
    }
}

export class UnresolvedItemError extends Error {
    
}


