
import { PreGroup, PreGroupSeq } from "./preGroup.js";
import { EvalExprSeq, CompExprSeq } from "./expr.js";

// PreExpr = Pre-expression
// A pre-expression is an expression which has not yet been resolved to a specific type.
export class PreExpr extends PreGroup {
    
    resolveStmts() {
        const resolvedComponents = this.components.map((component) => {
            if (component instanceof PreGroupSeq) {
                return component.resolveStmts();
            } else {
                return component;
            }
        });
        return new PreExpr(resolvedComponents);
    }
}

// PreExprSeq = Pre-expression sequence
export class PreExprSeq extends PreGroupSeq {
    // Concrete subclasses of PreExprSeq must implement these methods:
    // createExprSeq
    
    constructor(hasFactorType, preExprs, lineNumber) {
        super(preExprs, lineNumber);
        this.hasFactorType = hasFactorType;
    }
    
    resolveStmts(parentStmt = null) {
        const preExprs = this.preGroups.map((preExpr) => preExpr.resolveStmts());
        const output = this.createPreExprSeq(preExprs);
        output.lineNumber = this.lineNumber;
        return output;
    }
}

// EvalPreExprSeq = Evaltime pre-expression sequence
// Represents `(...)`, and `(*...)`
export class EvalPreExprSeq extends PreExprSeq {
    
    createPreExprSeq(preExprs) {
        return new EvalExprSeq(this.hasFactorType, preExprs);
    }
}

// CompPreExprSeq = Comptime pre-expression sequence
// Represents `<...>`, `<?...>`, `<??...>`, `<*...>`, `<*?...>`, and `<*??...>`.
export class CompPreExprSeq extends PreExprSeq {
    
    constructor(hasFactorType, exprSeqSelector, preExprs, lineNumber) {
        super(hasFactorType, preExprs, lineNumber);
        this.exprSeqSelector = exprSeqSelector;
    }
    
    createPreExprSeq(preExprs) {
        return new CompExprSeq(this.hasFactorType, this.exprSeqSelector, preExprs);
    }
}


