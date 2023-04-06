
import * as nodeUtils from "./nodeUtils.js";
import { AttrStmtSeq } from "./groupSeq.js";
import { ArgsStmt, TypeArgsStmt, FieldsStmt, MethodsStmt } from "./stmt.js";
import { Expr } from "./expr.js";
import { SpecialParser } from "./groupParser.js";
import { CustomFunc } from "./func.js";
import { TypeType } from "./itemType.js";
import { ResultRef } from "./itemRef.js";
import { Feature } from "./factor.js";
import { FeatureType } from "./factorType.js";
import { Obj, ObjType } from "./obj.js";

export class SpecialExpr extends Expr {
    // Concrete subclasses of SpecialExpr must implement these methods:
    // evaluateHelper
    
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
    
    getAttrStmtSeq() {
        for (const groupSeq of this.children) {
            if (groupSeq instanceof AttrStmtSeq) {
                return groupSeq;
            }
        }
        return null;
    }
    
    getAttrStmtChildren(attrStmtClass) {
        const stmtSeq = this.getAttrStmtSeq();
        const stmt = nodeUtils.getAttrStmt(stmtSeq, attrStmtClass);
        return (stmt === null) ? [] : stmt.getChildStmts();
    }
    
    getAttrStmtVars(attrStmtClass) {
        const stmtSeq = this.getAttrStmtSeq();
        return nodeUtils.getChildVars(stmtSeq, attrStmtClass);
    }
    
    evaluate(context) {
        return new ResultRef(this.evaluateHelper(context));
    }
}

export class ExprSpecialExpr extends SpecialExpr {
    
    init(parser) {
        this.exprSeq = parser.readExprSeq(true);
    }
    
    evaluateExpr(context) {
        return this.exprSeq.evaluateToItem(context);
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
    
    evaluateHelper(context) {
        return this.exprSeq.evaluateToItems(context);
    }
    
    aggregateCompItems(aggregator) {
        this.exprSeq.aggregateCompItems(aggregator);
    }
    
    convertToJs(jsConverter) {
        const codeList = this.exprSeq.convertToJsList(jsConverter);
        return `[${codeList.join(", ")}]`;
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
    
    getArgVars() {
        return this.getAttrStmtVars(ArgsStmt);
    }
    
    evaluateHelper(context) {
        return new CustomFunc(this.getArgVars(), this.bhvrStmtSeq, context);
    }
    
    aggregateCompItems(aggregator) {
        this.bhvrStmtSeq.aggregateCompItems(aggregator);
    }
    
    convertToJs(jsConverter) {
        // TODO: Assign default items.
        const argIdentifiers = this.getArgVars().map((variable) => (
            variable.getJsIdentifier()
        ));
        return `((${argIdentifiers.join(", ")}) => ${this.bhvrStmtSeq.convertToJs(jsConverter)})`;
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
    
    evaluateHelper(context) {
        const output = new Feature(this.fieldStmts, this.methodStmts, context);
        context.stowTypeId(this, output.typeId);
        return output;
    }
    
    getConstraintType() {
        return new FeatureType(this.fieldStmts, this.methodStmts, this);
    }
    
    isDiscerner() {
        return true;
    }
    
    aggregateCompItems(aggregator) {
        for (const fieldStmt of this.fieldStmts) {
            fieldStmt.aggregateCompItems(aggregator);
        }
        for (const methodStmt of this.methodStmts) {
            methodStmt.aggregateCompItems(aggregator);
        }
    }
    
    convertToJs(jsConverter) {
        const fieldCodeList = this.fieldStmts.map((stmt) => (
            stmt.convertToJs(jsConverter)
        ));
        const methodCodeList = this.methodStmts.map((stmt) => (
            stmt.convertToJs(jsConverter)
        ));
        return `(() => {
const feature = class extends classes.Feature {
static typeId = Symbol("typeId");
constructor(obj) {
super(obj);
${fieldCodeList.join("\n")}
}
${methodCodeList.join("\n")}
};
${this.getDiscernerJsIdentifier()} = feature.typeId;
return feature;
})()`;
    }
}

export class FeatureTypeExpr extends FeatureExpr {
    
    evaluateHelper(context) {
        return new FeatureType(this.fieldStmts, this.methodStmts);
    }
    
    getConstraintType() {
        return new TypeType(new FeatureType([], []));
    }
}

export class BundleExpr extends AttrsSpecialExpr {}

export class BundleTypeExpr extends AttrsSpecialExpr {}

export class ObjExpr extends ExprSpecialExpr {
    
    evaluateHelper(context) {
        return new Obj(this.evaluateExpr(context));
    }
    
    getConstraintType() {
        const factorType = this.exprSeq.getConstraintTypes()[0];
        return new ObjType(factorType);
    }
    
    aggregateCompItems(aggregator) {
        this.exprSeq.aggregateCompItems(aggregator);
    }
    
    convertToJs(jsConverter) {
        return `(new classes.Obj(${this.exprSeq.convertToJs(jsConverter)}))`;
    }
}

export class ObjTypeExpr extends ExprSpecialExpr {
    
    evaluateHelper(context) {
        return new ObjType(this.evaluateExpr(context));
    }
    
    getConstraintType() {
        return new TypeType(new ObjType());
    }
}

export class DiscernExpr extends ExprSpecialExpr {
    
    evaluateHelper(context) {
        const output = this.evaluateExpr(context);
        context.stowTypeId(this, output.typeId);
        return output;
    }
    
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


