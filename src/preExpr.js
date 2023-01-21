
// PreExpr = Pre-expression
// A pre-expression is an expression which has not yet been resolved to a specific type.
export class PreExpr {
    
    constructor(components) {
        this.components = components;
    }
}

// PreExprSeq = Pre-expression sequence
export class PreExprSeq {
    
    constructor(hasFactorType, preExprs) {
        this.hasFactorType = hasFactorType;
        this.preExprs = preExprs;
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


