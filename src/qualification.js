
export class GenericQualification {
    
    constructor(genericExpr, args) {
        this.genericExpr = genericExpr;
        this.args = args;
    }
    
    copy() {
        return new GenericQualification(this.genericExpr, this.args);
    }
}


