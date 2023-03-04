
import { AttrStmtSeq } from "./groupSeq.js";
import { ArgsStmt, TypeArgsStmt } from "./stmt.js";
import { Expr } from "./expr.js";
import { SpecialParser } from "./groupParser.js";
import { Func } from "./func.js";

export class SpecialExpr extends Expr {
    
    constructor(components, groupSeqs) {
        super(components);
        const parser = new SpecialParser(groupSeqs, this);
        this.init(parser);
        parser.assertEnd();
    }
    
    resolveVars() {
        const argsStmt = this.getAttrStmt(ArgsStmt);
        if (argsStmt !== null) {
            this.addVars(argsStmt.createVars());
        }
        const typeArgsStmt = this.getAttrStmt(TypeArgsStmt);
        if (typeArgsStmt !== null) {
            this.addVars(typeArgsStmt.createVars());
        }
    }
    
    getAttrStmt(attrStmtClass) {
        let attrStmtSeq = null;
        for (const groupSeq of this.children) {
            if (groupSeq instanceof AttrStmtSeq) {
                attrStmtSeq = groupSeq;
                break;
            }
        }
        return (attrStmtSeq === null) ? null : attrStmtSeq.getAttrStmt(attrStmtClass);
    }
}

export class ListExpr extends SpecialExpr {
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
        this.exprSeq = parser.readExprSeq();
    }
}

export class ListTypeExpr extends SpecialExpr {
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
        this.exprSeq = parser.readExprSeq();
    }
}

export class FuncExpr extends SpecialExpr {
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
        this.bhvrStmtSeq = parser.readBhvrStmtSeq();
    }
    
    evaluate() {
        const argsStmt = this.getAttrStmt(ArgsStmt);
        const argStmts = (argsStmt === null) ? [] : argsStmt.getChildStmts();
        const func = new Func(argStmts, this.bhvrStmtSeq);
        return (...args) => func.evaluate(args);
    }
}

export class FuncTypeExpr extends SpecialExpr {
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
    }
}

export class AwaitExpr extends SpecialExpr {
    
    init(parser) {
        this.exprSeq = parser.readExprSeq();
    }
}

export class ObjExpr extends SpecialExpr {
    
    init(parser) {
        this.exprSeq = parser.readExprSeq();
    }
}

export class ObjTypeExpr extends SpecialExpr {
    
    init(parser) {
        this.exprSeq = parser.readExprSeq();
    }
}

export class NominalTypeExpr extends SpecialExpr {
    
    init(parser) {
        this.exprSeq = parser.readExprSeq();
    }
}

export class AttrsSpecialExpr extends SpecialExpr {
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
    }
}

export class DictExpr extends AttrsSpecialExpr {}

export class DictTypeExpr extends AttrsSpecialExpr {}

export class MethodTypeExpr extends AttrsSpecialExpr {}

export class InterfaceTypeExpr extends AttrsSpecialExpr {}

export class FeatureExpr extends AttrsSpecialExpr {}

export class FeatureTypeExpr extends AttrsSpecialExpr {}

export class BundleExpr extends AttrsSpecialExpr {}

export class BundleTypeExpr extends AttrsSpecialExpr {}

export const specialConstructorMap = {
    list: ListExpr,
    listT: ListTypeExpr,
    dict: DictExpr,
    dictT: DictTypeExpr,
    func: FuncExpr,
    funcT: FuncTypeExpr,
    methodT: MethodTypeExpr,
    await: AwaitExpr,
    interfaceT: InterfaceTypeExpr,
    feature: FeatureExpr,
    featureT: FeatureTypeExpr,
    bundle: BundleExpr,
    bundleT: BundleTypeExpr,
    obj: ObjExpr,
    objT: ObjTypeExpr,
    nominalT: NominalTypeExpr,
};


