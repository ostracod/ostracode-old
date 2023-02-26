
import { UnresolvedItemError } from "./error.js";
import * as niceUtils from "./niceUtils.js";
import { Node } from "./node.js";
import { PreStmt } from "./preStmt.js";
import { PreExpr } from "./preExpr.js";

export class GroupSeq extends Node {
    
    constructor(groups) {
        super();
        this.setGroups(groups);
        this.lineNumber = null;
    }
    
    setGroups(groups) {
        this.groups = groups;
        this.setChildren(this.groups);
    }
    
    getLineNumber() {
        return this.lineNumber;
    }
    
    resolveStmts() {
        for (const group of this.groups) {
            group.resolveStmts();
        }
    }
    
    resolveVars() {
        // Do nothing.
    }
    
    resolveExprsAndVars() {
        this.resolveVars();
        for (const group of this.groups) {
            group.resolveExprsAndVars();
        }
    }
}

// StmtSeq = Statement sequence
export class StmtSeq extends GroupSeq {
    
    resolveStmts() {
        const stmts = this.groups.map((stmt) => (
            (stmt instanceof PreStmt) ? stmt.resolve() : stmt
        ));
        this.setGroups(stmts);
        super.resolveStmts();
    }
}

// BhvrStmtSeq = Behavior statement sequence
// Represents `{...}`.
export class BhvrStmtSeq extends StmtSeq {
    
    resolveVars() {
        for (const stmt of this.groups) {
            this.addVars(stmt.createParentVars());
        }
    }
}

// AttrStmtSeq = Attribute statement sequence
// Represents `[...]`.
export class AttrStmtSeq extends StmtSeq {
    
    getAttrStmt(attrStmtClass) {
        for (const stmt of this.groups) {
            if (stmt instanceof attrStmtClass) {
                return stmt;
            }
        }
        return null;
    }
}

// ExprSeq = Expression sequence
export class ExprSeq extends GroupSeq {
    
    constructor(hasFactorType, exprs) {
        super(exprs);
        this.hasFactorType = hasFactorType;
    }
    
    resolveExprsAndVars() {
        const exprs = this.groups.map((expr) => (
            (expr instanceof PreExpr) ? expr.resolve() : expr
        ));
        this.setGroups(exprs);
        super.resolveExprsAndVars();
    }
}

// EvalExprSeq = Evaltime expression sequence
// Represents `(...)`, and `(*...)`
export class EvalExprSeq extends ExprSeq {
    
}

// CompExprSeq = Comptime expression sequence
// Represents `<...>`, `<?...>`, `<??...>`, `<*...>`, `<*?...>`, and `<*??...>`.
export class CompExprSeq extends ExprSeq {
    
    constructor(hasFactorType, exprSeqSelector, exprs) {
        super(hasFactorType, exprs);
        this.exprSeqSelector = exprSeqSelector;
        this.itemResolutions = [];
        while (this.itemResolutions.length < this.groups.length) {
            this.itemResolutions.push({
                hasResolved: false,
                item: 0,
            });
        }
    }
    
    resolveCompItems() {
        // TODO: Use `exprSeqSelector` and `hasFactorType`.
        let resolvedCount = 0;
        const unresolvedExprs = [];
        for (let index = 0; index < this.groups.length; index++) {
            const resolution = this.itemResolutions[index];
            if (resolution.hasResolved) {
                continue;
            }
            const expr = this.groups[index];
            const result = expr.resolveCompItems();
            resolvedCount += result.resolvedCount;
            niceUtils.extendList(unresolvedExprs, result.unresolvedExprs);
            if (result.unresolvedExprs.length > 0) {
                continue;
            }
            try {
                resolution.item = expr.evaluate();
                resolution.hasResolved = true;
            } catch (error) {
                if (!(error instanceof UnresolvedItemError)) {
                    throw error;
                }
            }
        }
        for (let index = 0; index < this.groups.length; index++) {
            const resolution = this.itemResolutions[index];
            if (resolution.hasResolved) {
                resolvedCount += 1;
            } else {
                const expr = this.groups[index];
                unresolvedExprs.push(expr);
            }
        }
        return { resolvedCount, unresolvedExprs };
    }
}


