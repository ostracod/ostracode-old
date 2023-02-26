
export class UsageError extends Error {
    
}

export class CompilerError extends Error {
    
    constructor(message, ostraCodeFile = null, lineNumber = null) {
        super(message);
        this.ostraCodeFile = ostraCodeFile;
        this.lineNumber = lineNumber;
    }
    
    getLabel() {
        const components = ["Error"];
        if (this.lineNumber !== null) {
            components.push(" on line " + this.lineNumber);
        }
        if (this.ostraCodeFile !== null) {
            components.push(" of " + this.ostraCodeFile.srcPath);
        }
        return components.join("");
    }
}

export class CompilerErrorThrower {
    // Concrete subclasses of CompilerErrorThrower must implement these methods:
    // getLineNumber
    
    throwError(message) {
        throw new CompilerError(message, null, this.getLineNumber());
    }
}

export class UnresolvedItemError extends Error {
    
}


