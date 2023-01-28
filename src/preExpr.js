
import { PreGroup, PreGroupSeq } from "./preGroup.js";

// PreExpr = Pre-expression
// A pre-expression is an expression which has not yet been resolved to a specific type.
export class PreExpr extends PreGroup {
    
}

// PreExprSeq = Pre-expression sequence
export class PreExprSeq extends PreGroupSeq {
    
    constructor(hasFactorType, preExprs) {
        super(preExprs);
        this.hasFactorType = hasFactorType;
    }
}

// EvalPreExprSeq = Evaltime pre-expression sequence
// Represents `(...)`, and `(*...)`
export class EvalPreExprSeq extends PreExprSeq {
    
}

// CompPreExprSeq = Comptime pre-expression sequence
// Represents `<...>`, `<?...>`, `<??...>`, `<*...>`, `<*?...>`, and `<*??...>`.
export class CompPreExprSeq extends PreExprSeq {
    
    constructor(hasFactorType, exprSeqSelector, preExprs) {
        super(hasFactorType, preExprs);
        this.exprSeqSelector = exprSeqSelector;
    }
}


