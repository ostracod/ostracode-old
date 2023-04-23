
export class GenericQualification {
    
    constructor(exprSeq, argVars, args = null) {
        this.exprSeq = exprSeq;
        this.argVars = argVars;
        this.args = args;
    }
    
    copy() {
        return new GenericQualification(this.exprSeq, this.argVars, this.args);
    }
}


