
import { AttrStmtSeq } from "./groupSeq.js";
import { ArgsStmt, TypeArgsStmt, FieldsStmt, MethodsStmt } from "./stmt.js";
import { Expr } from "./expr.js";
import { SpecialParser } from "./groupParser.js";
import { CustomFunc } from "./func.js";
import { Feature } from "./factor.js";
import { Obj } from "./obj.js";

export class SpecialExpr extends Expr {
    
    constructor(components, groupSeqs) {
        super(components);
        const parser = new SpecialParser(groupSeqs, this);
        this.init(parser);
        parser.assertEnd();
    }
    
    resolveVars() {
        const argVars = this.getAttrStmtVars(ArgsStmt);
        this.addVars(argVars);
        const typeArgVars = this.getAttrStmtVars(TypeArgsStmt);
        this.addVars(typeArgVars);
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
    
    getAttrStmtChildren(attrStmtClass) {
        const stmt = this.getAttrStmt(attrStmtClass);
        return (stmt === null) ? [] : stmt.getChildStmts();
    }
    
    getAttrStmtVars(attrStmtClass) {
        const stmt = this.getAttrStmt(attrStmtClass);
        return (stmt === null) ? [] : stmt.getChildVars();
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
    
    evaluate(context) {
        const argVars = this.getAttrStmtVars(ArgsStmt);
        return new CustomFunc(argVars, this.bhvrStmtSeq, context);
    }
}

export class ExprSpecialExpr extends SpecialExpr {
    
    init(parser) {
        this.exprSeq = parser.readExprSeq(true);
    }
}

export class AwaitExpr extends ExprSpecialExpr {}

export class ObjExpr extends ExprSpecialExpr {
    
    evaluate(context) {
        const feature = this.exprSeq.groups[0].evaluate(context);
        return new Obj(feature);
    }
}

export class ObjTypeExpr extends ExprSpecialExpr {}

export class NominalTypeExpr extends ExprSpecialExpr {}

export class DiscernExpr extends ExprSpecialExpr {}

export class AttrsSpecialExpr extends SpecialExpr {
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
    }
}

export class DictExpr extends AttrsSpecialExpr {}

export class DictTypeExpr extends AttrsSpecialExpr {}

export class FuncTypeExpr extends AttrsSpecialExpr {}

export class MethodTypeExpr extends AttrsSpecialExpr {}

export class InterfaceTypeExpr extends AttrsSpecialExpr {}

export class FeatureExpr extends AttrsSpecialExpr {
    
    evaluate(context) {
        const fieldStmts = this.getAttrStmtChildren(FieldsStmt);
        const methodStmts = this.getAttrStmtChildren(MethodsStmt);
        return new Feature(fieldStmts, methodStmts, context);
    }
}

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
    discern: DiscernExpr,
};


