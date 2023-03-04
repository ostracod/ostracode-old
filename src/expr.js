
import { CompilerError } from "./error.js";
import { ResolvedGroup } from "./group.js";

export class Expr extends ResolvedGroup {
    
    evaluate() {
        this.throwError("Evaluation of this expression type is not yet implemented.");
    }
}

export class SingleComponentExpr extends Expr {
    
    constructor(component) {
        super([component]);
    }
}

export class LiteralExpr extends SingleComponentExpr {
    
}

export class NumLiteralExpr extends LiteralExpr {
    
    constructor(numToken) {
        super(numToken);
        this.value = numToken.getNum();
    }
    
    getDisplayStringDetail() {
        return this.value;
    }
    
    evaluate() {
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
    
    evaluate() {
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
    
    evaluate() {
        const variable = this.getVar(this.name);
        if (variable === null) {
            this.throwError(`Cannot find variable with name "${this.name}".`);
        }
        let output;
        try {
            output = variable.getItem();
        } catch (error) {
            if (error instanceof CompilerError) {
                error.lineNumber = this.getLineNumber();
            }
            throw error;
        }
        return output;
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
}


