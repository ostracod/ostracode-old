
import { ExprSeqSelector, FlowControl } from "./constants.js";
import { constructors } from "./constructors.js";
import { Node } from "./node.js";
import { PreStmt } from "./preStmt.js";
import { PreExpr } from "./preExpr.js";
import { EvalContext } from "./evalContext.js";
import { ResultRef } from "./itemRef.js";
import { TypeType } from "./itemType.js";
import { AnchorType } from "./anchor.js";

export class GroupSeq extends Node {
    
    constructor(groups) {
        super();
        this.setGroups(groups);
        this.lineNum = null;
    }
    
    setGroups(groups) {
        this.groups = groups;
        this.setChildren(this.groups);
    }
    
    getLineNum() {
        return this.lineNum;
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
            this.addVars(stmt.getParentVars());
        }
    }
    
    evaluate(parentContext) {
        const evalContext = new EvalContext({ parent: parentContext, node: this });
        for (const stmt of this.groups) {
            const result = stmt.evaluate(evalContext);
            if (result.flowControl !== FlowControl.None) {
                return result;
            }
        }
        return { flowControl: FlowControl.None };
    }
    
    iterateCompItems(compContext, handle) {
        for (const stmt of this.groups) {
            stmt.iterateCompItems(compContext, handle);
        }
    }
    
    convertToJsList(jsConverter) {
        return this.groups.map((stmt) => stmt.convertToJs(jsConverter));
    }
    
    convertToJs(jsConverter) {
        return "{\n" + this.convertToJsList(jsConverter).join("\n") + "\n}";
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
    // Concrete subclasses of ExprSeq must implement these methods:
    // evaluate, iterateCompItems, convertToJsList
    
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
    
    getConstraintTypeHelper(compContext, expr) {
        return expr.getConstraintType(compContext);
    }
    
    getConstraintTypesHelper(compContext) {
        return this.groups.map((expr) => this.getConstraintTypeHelper(compContext, expr));
    }
    
    getConstraintTypes(compContext) {
        // TODO: Use `hasFactorType`.
        return this.getConstraintTypesHelper(compContext);
    }
    
    getConstraintType(compContext) {
        return this.getConstraintTypes(compContext)[0];
    }
    
    evaluateToItems(evalContext) {
        return this.evaluate(evalContext).map((itemRef) => itemRef.read());
    }
    
    evaluateToItem(evalContext) {
        return this.evaluateToItems(evalContext)[0];
    }
    
    convertToJs(jsConverter) {
        return this.convertToJsList(jsConverter)[0];
    }
}

// EvalExprSeq = Evaltime expression sequence
// Represents `(...)`, and `(*...)`
export class EvalExprSeq extends ExprSeq {
    
    evaluate(evalContext) {
        return this.groups.map((group) => group.evaluate(evalContext));
    }
    
    iterateCompItems(compContext, handle) {
        for (const expr of this.groups) {
            expr.iterateCompItems(compContext, handle);
        }
    }
    
    convertToJsList(jsConverter) {
        return this.groups.map((expr) => expr.convertToJs(jsConverter));
    }
}

// CompExprSeq = Comptime expression sequence
// Represents `<...>`, `<?...>`, `<*...>`, `<*?...>`, and `<@...>`.
export class CompExprSeq extends ExprSeq {
    
    constructor(hasFactorType, exprSeqSelector, exprs) {
        super(hasFactorType, exprs);
        this.exprSeqSelector = exprSeqSelector;
    }
    
    getConstraintTypeHelper(compContext, expr) {
        const type = expr.getConstraintType(compContext);
        if (this.exprSeqSelector === ExprSeqSelector.ReturnItems) {
            return type;
        } else if (this.exprSeqSelector === ExprSeqSelector.ConstraintTypes) {
            return new TypeType(type);
        } else if (this.exprSeqSelector === ExprSeqSelector.Anchors) {
            return new AnchorType(type);
        }
    }
    
    resolveCompItem(compContext, expr) {
        expr.validateTypes(compContext);
        // TODO: Use `hasFactorType`.
        if (this.exprSeqSelector === ExprSeqSelector.ReturnItems) {
            const evalContext = new EvalContext({ compContext, node: this });
            return expr.evaluateToItem(evalContext);
        } else if (this.exprSeqSelector === ExprSeqSelector.ConstraintTypes) {
            return expr.getConstraintType(compContext);
        } else if (this.exprSeqSelector === ExprSeqSelector.Anchors) {
            if (!(expr instanceof constructors.IdentifierExpr)) {
                this.throwError("Anchor expression sequences only accept variable identifiers.");
            }
            return expr.getNonNullVar().createAnchor();
        } else {
            throw new Error(`Unsupported expression sequence selector "${this.exprSeqSelector.description}".`);
        }
    }
    
    validateTypes(compContext) {
        // Do nothing. Types have already been validated during comp item resolution.
    }
    
    evaluate(evalContext) {
        const items = evalContext.compContext.getSeqItems(this);
        return items.map((item) => new ResultRef(item));
    }
    
    iterateCompItems(compContext, handle) {
        compContext.iterateSeqItems(this, handle);
    }
    
    convertToJsList(jsConverter) {
        const items = jsConverter.getCompContext().getSeqItems(this);
        return items.map((item) => jsConverter.convertItemToJs(item));
    }
}


