
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
    
    getDisplayString(indentation) {
        return super.getDisplayString(indentation) + ` (${this.value})`;
    }
}


