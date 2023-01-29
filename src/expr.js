
export class ExprSeq {
    
    constructor(hasFactorType, preExprs) {
        this.hasFactorType = hasFactorType;
        this.preExprs = preExprs;
    }
}

export class EvalExprSeq extends ExprSeq {
    
}

export class CompExprSeq extends ExprSeq {
    
    constructor(hasFactorType, exprSeqSelector, preExprs) {
        super(hasFactorType, preExprs);
        this.exprSeqSelector = exprSeqSelector;
    }
}


