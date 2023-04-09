
import { ExprSeqSelector, FlowControl } from "./constants.js";
import { CompilerError, UnresolvedItemError } from "./error.js";
import * as niceUtils from "./niceUtils.js";
import { Node } from "./node.js";
import { PreStmt } from "./preStmt.js";
import { PreExpr } from "./preExpr.js";
import { EvalContext } from "./evalContext.js";
import { ResultRef } from "./itemRef.js";
import { EvalCompartment } from "./compartment.js";

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
    
    shouldStoreCompartmentsHelper() {
        return true;
    }
    
    evaluate(parentContext) {
        const context = new EvalContext(parentContext, this);
        for (const stmt of this.groups) {
            const result = stmt.evaluate(context);
            if (result.flowControl !== FlowControl.None) {
                return result;
            }
        }
        return { flowControl: FlowControl.None };
    }
    
    aggregateCompItems(aggregator) {
        for (const stmt of this.groups) {
            stmt.aggregateCompItems(aggregator);
        }
    }
    
    convertToJsList(jsConverter) {
        const output = [];
        for (const compartment of this.getCompartments()) {
            if (compartment instanceof EvalCompartment) {
                output.push(`let ${compartment.getJsIdentifier()};`);
            }
        }
        this.groups.forEach((stmt) => {
            output.push(stmt.convertToJs(jsConverter));
        });
        return output;
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
    // evaluate, aggregateCompItems, convertToJsList
    
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
    
    getConstraintTypesHelper() {
        return this.groups.map((expr) => expr.getConstraintType());
    }
    
    getConstraintTypes() {
        // TODO: Use `hasFactorType`.
        return this.getConstraintTypesHelper();
    }
    
    evaluateToItems(context) {
        return this.evaluate(context).map((itemRef) => itemRef.read());
    }
    
    evaluateToItem(context) {
        return this.evaluateToItems(context)[0];
    }
    
    convertToJs(jsConverter) {
        return this.convertToJsList(jsConverter)[0];
    }
}

// EvalExprSeq = Evaltime expression sequence
// Represents `(...)`, and `(*...)`
export class EvalExprSeq extends ExprSeq {
    
    evaluate(context) {
        return this.groups.map((group) => group.evaluate(context));
    }
    
    aggregateCompItems(aggregator) {
        for (const expr of this.groups) {
            expr.aggregateCompItems(aggregator);
        }
    }
    
    convertToJsList(jsConverter) {
        return this.groups.map((expr) => expr.convertToJs(jsConverter));
    }
}

// CompExprSeq = Comptime expression sequence
// Represents `<...>`, `<?...>`, `<??...>`, `<*...>`, `<*?...>`, and `<*??...>`.
export class CompExprSeq extends ExprSeq {
    
    constructor(hasFactorType, exprSeqSelector, exprs) {
        super(hasFactorType, exprs);
        this.exprSeqSelector = exprSeqSelector;
        this.itemResolutions = [];
        while (this.itemResolutions.length < this.groups.length) {
            this.itemResolutions.push({ hasResolved: false, item: 0 });
        }
    }
    
    resolveCompItem(expr) {
        if (this.exprSeqSelector === ExprSeqSelector.ReturnItems) {
            const context = new EvalContext(null, this);
            return expr.evaluateToItem(context);
        }
        if (this.exprSeqSelector === ExprSeqSelector.ConstraintTypes) {
            return expr.getConstraintType();
        }
        if (this.exprSeqSelector === ExprSeqSelector.InitTypes) {
            throw new CompilerError("Retrieving initialization type is not yet supported.");
        }
        throw new Error("Unexpected expression sequence selector.");
    }
    
    resolveCompItems() {
        // TODO: Use `hasFactorType`.
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
                resolution.item = this.resolveCompItem(expr);
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
    
    getCompItems() {
        if (this.itemResolutions.some((resolution) => !resolution.hasResolved)) {
            throw new UnresolvedItemError();
        }
        return this.itemResolutions.map((resolution) => resolution.item);
    }
    
    shouldStoreCompartmentsHelper() {
        return true;
    }
    
    evaluate(context) {
        return this.getCompItems().map((item) => new ResultRef(item));
    }
    
    aggregateCompItems(aggregator) {
        for (const item of this.getCompItems()) {
            aggregator.addItem(item);
        }
    }
    
    convertToJsList(jsConverter) {
        return this.getCompItems().map((item) => jsConverter.convertItemToJs(item));
    }
}


