
import { ResolvedGroup } from "./group.js";

export class Expr extends ResolvedGroup {
    
}

export class LiteralExpr extends Expr {
    
}

export class NumLiteralExpr extends LiteralExpr {
    
    constructor(numToken) {
        super([numToken]);
        this.value = numToken.getNum();
    }
    
    getDisplayStringDetail() {
        return this.value;
    }
}

export class OperatorExpr extends Expr {
    
    constructor(operator, operand1, operand2) {
        super();
        this.operator = operator;
    }
    
    getDisplayStringDetail() {
        return this.operator.text;
    }
}

export class UnaryExpr extends OperatorExpr {
    
    constructor(operator, operand) {
        super(operator);
        this.operand = this.addChild(operand);
    }
}

export class BinaryExpr extends OperatorExpr {
    
    constructor(operator, operand1, operand2) {
        super(operator);
        this.operand1 = this.addChild(operand1);
        this.operand2 = this.addChild(operand2);
    }
}


