
import { AttrStmtSeq } from "./groupSeq.js";
import { ArgsStmt, TypeArgsStmt, FieldsStmt, MethodsStmt } from "./stmt.js";
import { Expr } from "./expr.js";
import { SpecialParser } from "./groupParser.js";
import { CustomFunc } from "./func.js";
import { TypeType } from "./itemType.js";
import { Feature } from "./factor.js";
import { FeatureType } from "./factorType.js";
import { Obj, ObjType } from "./obj.js";

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
    
    isDiscerner() {
        return false;
    }
    
    getDiscerners() {
        const output = super.getDiscerners();
        if (this.isDiscerner()) {
            output.push(this);
        }
        return output;
    }
}

export class ExprSpecialExpr extends SpecialExpr {
    
    init(parser) {
        this.exprSeq = parser.readExprSeq(true);
    }
}

export class AttrsSpecialExpr extends SpecialExpr {
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
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

export class DictExpr extends AttrsSpecialExpr {}

export class DictTypeExpr extends AttrsSpecialExpr {}

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

export class FuncTypeExpr extends AttrsSpecialExpr {}

export class MethodTypeExpr extends AttrsSpecialExpr {}

export class AwaitExpr extends ExprSpecialExpr {}

export class InterfaceTypeExpr extends AttrsSpecialExpr {}

export class FeatureExpr extends AttrsSpecialExpr {
    
    constructor(components, groupSeqs) {
        super(components, groupSeqs);
        this.fieldStmts = this.getAttrStmtChildren(FieldsStmt);
        this.methodStmts = this.getAttrStmtChildren(MethodsStmt);
    }
}

export class FeatureValueExpr extends FeatureExpr {
    
    evaluate(context) {
        return new Feature(this.fieldStmts, this.methodStmts, context);
    }
    
    getConstraintType() {
        return new FeatureType(this.fieldStmts, this.methodStmts, this);
    }
    
    isDiscerner() {
        return true;
    }
}

export class FeatureTypeExpr extends FeatureExpr {
    
    evaluate(context) {
        return new FeatureType(this.fieldStmts, this.methodStmts);
    }
    
    getConstraintType() {
        return new TypeType(new FeatureType([], []));
    }
}

export class BundleExpr extends AttrsSpecialExpr {}

export class BundleTypeExpr extends AttrsSpecialExpr {}

export class ObjExpr extends ExprSpecialExpr {
    
    evaluate(context) {
        const factor = this.exprSeq.evaluate(context)[0];
        return new Obj(factor);
    }
    
    getConstraintType() {
        const factorType = this.exprSeq.getConstraintTypes()[0];
        return new ObjType(factorType);
    }
}

export class ObjTypeExpr extends ExprSpecialExpr {
    
    evaluate(context) {
        const factorType = this.exprSeq.evaluate(context)[0];
        return new ObjType(factorType);
    }
    
    getConstraintType() {
        return new TypeType(new ObjType());
    }
}

export class DiscernExpr extends ExprSpecialExpr {
    
    isDiscerner() {
        return true;
    }
}

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
    feature: FeatureValueExpr,
    featureT: FeatureTypeExpr,
    bundle: BundleExpr,
    bundleT: BundleTypeExpr,
    obj: ObjExpr,
    objT: ObjTypeExpr,
    discern: DiscernExpr,
};


