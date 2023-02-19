
import { Expr } from "./expr.js";
import { SpecialParser } from "./groupParser.js";

export class SpecialExpr extends Expr {
    
    constructor(components, groupSeqs) {
        super(components);
        const parser = new SpecialParser(groupSeqs, this);
        this.init(parser);
        parser.assertEnd();
    }
}

export class ListExpr extends SpecialExpr {
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
        this.exprSeq = parser.readExprSeq();
    }
}

export const specialConstructorMap = {
    list: ListExpr,
};


