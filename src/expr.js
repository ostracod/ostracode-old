
import { GroupSeq } from "./group.js";

export class ExprSeq extends GroupSeq {
    
    constructor(hasFactorType, preExprs) {
        super(null);
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


