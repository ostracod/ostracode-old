
import * as compUtils from "./compUtils.js";
import { constructors } from "./constructors.js";
import { ResolvedGroup } from "./group.js";
import { NumType, StrType } from "./itemType.js";
import { ResultRef } from "./itemRef.js";

export class Expr extends ResolvedGroup {
    // Concrete subclasses of Expr must implement these methods:
    // getConstraintType, evaluate, iterateCompItems
    // `iterateCompItems` is called on every item which is
    // transferred from comptime to evaltime.
    
    getConstraintType(compContext) {
        this.throwError("getConstraintType is not yet implemented for this expression type.");
    }
    
    evaluate(evalContext) {
        this.throwError("Evaluation of this expression type is not yet implemented.");
    }
    
    evaluateToItem(evalContext) {
        return this.evaluate(evalContext).read();
    }
}

export class SingleComponentExpr extends Expr {
    
    constructor(component) {
        super([component]);
    }
}

export class LiteralExpr extends SingleComponentExpr {
    // Concrete subclasses of LiteralExpr must implement these methods:
    // getItem
    
    evaluate(evalContext) {
        return new ResultRef(this.getItem());
    }
    
    iterateCompItems(compContext, handle) {
        const item = this.getItem();
        const result = handle(item);
        if (typeof result !== "undefined" && result.item !== item) {
            throw new Error("Cannot replace item of literal expression.");
        }
    }
    
    convertToJs(jsConverter) {
        return jsConverter.convertItemToJs(this.getItem());
    }
}

export class NumLiteralExpr extends LiteralExpr {
    
    constructor(numToken) {
        super(numToken);
        this.value = numToken.getNum();
    }
    
    getDisplayStringDetail() {
        return this.value;
    }
    
    getConstraintType(compContext) {
        return new NumType();
    }
    
    getItem() {
        return this.value;
    }
}

export class StrLiteralExpr extends LiteralExpr {
    
    constructor(strToken) {
        super(strToken);
        this.text = strToken.text;
    }
    
    getDisplayStringDetail() {
        return this.text;
    }
    
    getConstraintType(compContext) {
        return new StrType();
    }
    
    getItem() {
        return this.text;
    }
}

export class IdentifierExpr extends SingleComponentExpr {
    
    constructor(wordToken) {
        super(wordToken);
        this.name = wordToken.text;
    }
    
    getDisplayStringDetail() {
        return this.name;
    }
    
    getNonNullVar() {
        const variable = this.getVar(this.name);
        if (variable === null) {
            this.throwError(`Cannot find variable with name "${this.name}".`);
        }
        return variable;
    }
    
    getUnwrappedVar(compContext) {
        const variable = this.getNonNullVar();
        return variable.unwrap(compContext);
    }
    
    buildClosureContext(destContext, srcContext) {
        const content = srcContext.getVarContent(this.name);
        if (content !== null) {
            destContext.addVarContent(content);
        }
        super.buildClosureContext(destContext, srcContext);
    }
    
    evaluate(evalContext) {
        return this.tryOperation(() => (
            evalContext.getRef(this.name)
        ));
    }
    
    getConstraintType(compContext) {
        return this.getNonNullVar().getConstraintType(compContext);
    }
    
    iterateCompItems(compContext, handle) {
        this.getUnwrappedVar(compContext).iterateCompItems(compContext, handle);
    }
    
    convertToJs(jsConverter) {
        return jsConverter.convertVarToRefJs(this.getNonNullVar());
    }
}

constructors.IdentifierExpr = IdentifierExpr;

export class OperatorExpr extends Expr {
    
    constructor(components, operator) {
        super(components);
        this.operator = operator;
    }
    
    getDisplayStringDetail() {
        return this.operator.text;
    }
}

export class UnaryExpr extends OperatorExpr {
    
    constructor(components, operator, operand) {
        super(components, operator);
        this.operand = this.addChild(operand);
    }
    
    evaluate(evalContext) {
        return this.tryOperation(() => (
            this.operator.perform(evalContext, this.operand)
        ));
    }
    
    iterateCompItems(compContext, handle) {
        this.operator.iterateCompItems(compContext, this.operand, handle);
    }
    
    convertToJs(jsConverter) {
        return this.operator.convertToJs(this.operand, jsConverter);
    }
}

export class IdentifierAccessExpr extends OperatorExpr {
    
    constructor(components, operator, operand, name) {
        super(components);
        this.operator = operator;
        this.operand = this.addChild(operand);
        this.name = name;
    }
    
    getDisplayStringDetail() {
        return this.name;
    }
    
    evaluate(evalContext) {
        return this.tryOperation(() => (
            this.operator.perform(evalContext, this.operand, this.name)
        ));
    }
    
    iterateCompItems(compContext, handle) {
        this.operand.iterateCompItems(compContext, handle);
    }
    
    convertToJs(jsConverter) {
        return this.tryOperation(() => (
            this.operator.convertToJs(this.operand, this.name, jsConverter)
        ));
    }
}

export class BinaryExpr extends OperatorExpr {
    
    constructor(components, operator, operand1, operand2) {
        super(components, operator);
        this.operand1 = this.addChild(operand1);
        this.operand2 = this.addChild(operand2);
    }
    
    getConstraintType(compContext) {
        return this.tryOperation(() => (
            this.operator.getConstraintType(compContext, this.operand1, this.operand2)
        ));
    }
    
    evaluate(evalContext) {
        const itemRef1 = this.operand1.evaluate(evalContext);
        const itemRef2 = this.operand2.evaluate(evalContext);
        return this.tryOperation(() => (
            this.operator.perform(itemRef1, itemRef2)
        ));
    }
    
    iterateCompItems(compContext, handle) {
        this.operator.iterateCompItems(compContext, this.operand1, this.operand2, handle);
    }
    
    convertToJs(jsConverter) {
        return this.operator.convertToJs(this.operand1, this.operand2, jsConverter);
    }
}

export class ExprSeqExpr extends SingleComponentExpr {
    
    constructor(exprSeq) {
        super(exprSeq);
        this.exprSeq = this.addChild(exprSeq);
    }
    
    evaluate(evalContext) {
        return this.exprSeq.evaluate(evalContext)[0];
    }
    
    iterateCompItems(compContext, handle) {
        this.exprSeq.iterateCompItems(compContext, handle);
    }
    
    convertToJs(jsConverter) {
        return "(" + this.exprSeq.convertToJs(jsConverter) + ")";
    }
}

export class InvocationExpr extends Expr {
    
    constructor(components, operand, argExprSeq) {
        super(components);
        this.operand = this.addChild(operand);
        this.argExprSeq = this.addChild(argExprSeq);
    }
    
    evaluate(evalContext) {
        const func = this.operand.evaluateToItem(evalContext);
        const args = this.argExprSeq.evaluateToItems(evalContext);
        compUtils.validateKnownItems([func, ...args]);
        return new ResultRef(func.evaluate(args));
    }
    
    iterateCompItems(compContext, handle) {
        this.argExprSeq.iterateCompItems(compContext, handle);
        this.operand.iterateCompItems(compContext, handle);
    }
    
    convertToJs(jsConverter) {
        const codeList = this.argExprSeq.convertToJsList(jsConverter);
        return "(" + this.operand.convertToJs(jsConverter) + "(" + codeList.join(", ") + "))";
    }
}


