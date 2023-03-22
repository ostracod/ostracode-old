
import * as compUtils from "./compUtils.js";
import { CompilerError } from "./error.js";
import { ResolvedGroup } from "./group.js";
import { NumType, StrType } from "./itemType.js";
import { ResultRef } from "./itemRef.js";
import { ObjType } from "./obj.js";

export class Expr extends ResolvedGroup {
    // Concrete subclasses of Expr must implement these methods:
    // getConstraintType, evaluate
    
    getConstraintType() {
        this.throwError("getConstraintType is not yet implemented for this expression type.");
    }
    
    evaluate(context) {
        this.throwError("Evaluation of this expression type is not yet implemented.");
    }
    
    evaluateToItem(context) {
        return this.evaluate(context).read();
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
    
    evaluate(context) {
        return new ResultRef(this.getItem());
    }
    
    convertToJs() {
        return compUtils.convertItemToJs(this.getItem());
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
    
    getConstraintType() {
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
    
    getConstraintType() {
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
    
    evaluate(context) {
        try {
            return context.getRefByVar(this.getNonNullVar());
        } catch (error) {
            if (error instanceof CompilerError) {
                error.lineNum = this.getLineNum();
            }
            throw error;
        }
    }
    
    getConstraintType() {
        return this.getNonNullVar().getConstraintType();
    }
    
    convertToJs() {
        return this.getNonNullVar().convertToRefJs();
    }
}

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
}

export class BinaryExpr extends OperatorExpr {
    
    constructor(components, operator, operand1, operand2) {
        super(components, operator);
        this.operand1 = this.addChild(operand1);
        this.operand2 = this.addChild(operand2);
    }
    
    evaluate(context) {
        const itemRef1 = this.operand1.evaluate(context);
        const itemRef2 = this.operand2.evaluate(context);
        return this.operator.perform(itemRef1, itemRef2);
    }
}

export class IdentifierAccessExpr extends Expr {
    
    constructor(components, operand, name) {
        super(components);
        this.operand = this.addChild(operand);
        this.name = name;
    }
    
    getDisplayStringDetail() {
        return this.name;
    }
    
    evaluate(context) {
        const item = this.operand.evaluateToItem(context);
        const type = this.operand.getConstraintType();
        if (type instanceof ObjType) {
            return type.factorType.getObjMember(item, this.name, context);
        } else {
            this.throwError("Item member access is not yet implemented.");
        }
    }
}

export class ExprSeqExpr extends SingleComponentExpr {
    
    constructor(exprSeq) {
        super(exprSeq);
        this.exprSeq = this.addChild(exprSeq);
    }
}

export class ArgsExpr extends Expr {
    
    constructor(components, operand, argExprSeq) {
        super(components);
        this.operand = this.addChild(operand);
        this.argExprSeq = this.addChild(argExprSeq);
    }
    
    evaluate(context) {
        // TODO: Handle item qualification.
        const func = this.operand.evaluateToItem(context);
        const args = this.argExprSeq.evaluateToItems(context);
        return new ResultRef(func.evaluate(args));
    }
    
    convertToJs() {
        const codeList = this.argExprSeq.convertToJsList();
        return "(" + this.operand.convertToJs() + "(" + codeList.join(", ") + "))";
    }
}


