
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
            components.push(" of " + this.ostraCodeFile.srcPath);
        }
        return components.join("");
    }
}

export class CompilerErrorThrower {
    // Concrete subclasses of CompilerErrorThrower must implement these methods:
    // getLineNum
    
    throwError(message) {
        throw new CompilerError(message, null, this.getLineNum());
    }
}

export class UnresolvedItemError extends Error {
    
}


