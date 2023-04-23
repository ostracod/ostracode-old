
import * as nodeUtils from "./nodeUtils.js";
import { AttrStmtSeq } from "./groupSeq.js";
import { ArgsStmt, ItemFieldsStmt, SharedFieldsStmt, ElemTypeStmt } from "./stmt.js";
import { Expr } from "./expr.js";
import { SpecialParser } from "./groupParser.js";
import { CustomFunc, UnboundCustomMethod } from "./func.js";
import { TypeType, ListType } from "./itemType.js";
import { ResultRef } from "./itemRef.js";
import { ReflexiveVar } from "./var.js";
import { Feature } from "./factor.js";
import { FeatureType } from "./factorType.js";
import { Obj, ObjType } from "./obj.js";
import { GenericQualification } from "./qualification.js";

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
    }
    
    getAttrStmtSeq() {
        for (const groupSeq of this.children) {
            if (groupSeq instanceof AttrStmtSeq) {
                return groupSeq;
            }
        }
        return null;
    }
    
    getAttrStmt(attrStmtClass) {
        const stmtSeq = this.getAttrStmtSeq();
        return nodeUtils.getAttrStmt(stmtSeq, attrStmtClass);
    }
    
    getAttrStmtChildren(attrStmtClass) {
        const stmt = this.getAttrStmt(attrStmtClass);
        return (stmt === null) ? [] : stmt.getChildStmts();
    }
    
    getAttrStmtVars(attrStmtClass) {
        const stmtSeq = this.getAttrStmtSeq();
        return nodeUtils.getChildVars(stmtSeq, attrStmtClass);
    }
    
    getArgVars() {
        return this.getAttrStmtVars(ArgsStmt);
    }
    
    evaluate(evalContext) {
        return new ResultRef(this.evaluateHelper(evalContext));
    }
}

export class ExprSpecialExpr extends SpecialExpr {
    
    init(parser) {
        this.exprSeq = parser.readExprSeq(true);
    }
    
    evaluateExpr(evalContext) {
        return this.exprSeq.evaluateToItem(evalContext);
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
        this.exprSeq = parser.readExprSeq(false, true);
    }
    
    getConstraintType(compContext) {
        const elemTypeStmt = this.getAttrStmt(ElemTypeStmt);
        let elemType;
        if (elemTypeStmt === null) {
            elemType = null;
        } else {
            elemType = compContext.getSeqItem(elemTypeStmt.exprSeq);
        }
        return new ListType(elemType);
    }
    
    evaluateHelper(evalContext) {
        if (this.exprSeq === null) {
            return [];
        } else {
            return this.exprSeq.evaluateToItems(evalContext);
        }
    }
    
    aggregateCompItems(aggregator) {
        if (this.exprSeq !== null) {
            this.exprSeq.aggregateCompItems(aggregator);
        }
    }
    
    convertToJs(jsConverter) {
        if (this.exprSeq === null) {
            return "[]";
        } else {
            const codeList = this.exprSeq.convertToJsList(jsConverter);
            return `[${codeList.join(", ")}]`;
        }
    }
}

export class ListTypeExpr extends SpecialExpr {
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
        this.exprSeq = parser.readExprSeq(false, true);
    }
}

export class DictExpr extends AttrsSpecialExpr {}

export class DictTypeExpr extends AttrsSpecialExpr {}

export class InvocableExpr extends SpecialExpr {
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
        this.bhvrStmtSeq = parser.readBhvrStmtSeq();
    }
    
    aggregateCompItems(aggregator) {
        this.bhvrStmtSeq.aggregateCompItems(aggregator);
    }
    
    getArgIdentifiers() {
        return this.getArgVars().map((variable) => (
            variable.getJsIdentifier()
        ));
    }
}

export class FuncExpr extends InvocableExpr {
    
    evaluateHelper(evalContext) {
        return new CustomFunc(this.getArgVars(), this.bhvrStmtSeq, evalContext);
    }
    
    convertToJs(jsConverter) {
        // TODO: Assign default items.
        const argIdentifiers = this.getArgIdentifiers();
        return `((${argIdentifiers.join(", ")}) => ${this.bhvrStmtSeq.convertToJs(jsConverter)})`;
    }
}

export class FuncTypeExpr extends AttrsSpecialExpr {}

export class MethodExpr extends InvocableExpr {
    
    getFeatureExpr() {
        return this.getParent(FeatureExpr);
    }
    
    resolveVars() {
        super.resolveVars();
        const featureType = this.getFeatureExpr().getConstraintTypeHelper();
        const objType = new ObjType(featureType);
        this.selfVar = new ReflexiveVar("self", objType);
        this.addVar(this.selfVar);
    }
    
    evaluateHelper(evalContext) {
        return new UnboundCustomMethod(this, evalContext);
    }
    
    convertToJs(jsConverter) {
        // TODO: Assign default items.
        const argIdentifiers = this.getArgIdentifiers();
        return `(function (${argIdentifiers.join(", ")}) ${this.bhvrStmtSeq.convertToJs(jsConverter)})`;
    }
}

export class MethodTypeExpr extends AttrsSpecialExpr {}

export class AwaitExpr extends ExprSpecialExpr {}

export class InterfaceTypeExpr extends AttrsSpecialExpr {}

export class FeatureExpr extends AttrsSpecialExpr {
    // Concrete subclasses of FeatureExpr must implement these methods:
    // getConstraintTypeHelper
    
    constructor(components, groupSeqs) {
        super(components, groupSeqs);
        this.itemFieldStmts = this.getAttrStmtChildren(ItemFieldsStmt);
        this.sharedFieldStmts = this.getAttrStmtChildren(SharedFieldsStmt);
    }
    
    getConstraintType(compContext) {
        return this.getConstraintTypeHelper();
    }
}

export class FeatureValueExpr extends FeatureExpr {
    
    evaluateHelper(evalContext) {
        const output = new Feature(this.itemFieldStmts, this.sharedFieldStmts, evalContext);
        evalContext.stowTypeId(this, output.typeId);
        return output;
    }
    
    getConstraintTypeHelper() {
        return new FeatureType(this.itemFieldStmts, this.sharedFieldStmts, this);
    }
    
    isDiscerner() {
        return true;
    }
    
    aggregateCompItems(aggregator) {
        for (const fieldStmt of this.itemFieldStmts) {
            fieldStmt.aggregateCompItems(aggregator);
        }
        for (const fieldStmt of this.sharedFieldStmts) {
            fieldStmt.aggregateCompItems(aggregator);
        }
    }
    
    convertToJs(jsConverter) {
        const compartment = this.getDiscernerCompartment();
        const itemFieldCodeList = this.itemFieldStmts.map((stmt) => (
            stmt.convertToItemJs(jsConverter)
        ));
        const sharedFieldCodeList = this.sharedFieldStmts.map((stmt) => (
            stmt.convertToSharedJs(jsConverter)
        ));
        return `(() => {
const feature = class extends classes.Feature {
static typeId = Symbol("typeId");
constructor(obj) {
super(obj);
${itemFieldCodeList.join("\n")}
}
${sharedFieldCodeList.join("\n")}
};
${compartment.convertToJs()} = feature.typeId;
return feature;
})()`;
    }
}

export class FeatureTypeExpr extends FeatureExpr {
    
    evaluateHelper(evalContext) {
        return new FeatureType(this.fieldStmts, this.methodStmts);
    }
    
    getConstraintTypeHelper() {
        return new TypeType(new FeatureType([], []));
    }
}

export class BundleExpr extends AttrsSpecialExpr {}

export class BundleTypeExpr extends AttrsSpecialExpr {}

export class ObjExpr extends ExprSpecialExpr {
    
    evaluateHelper(evalContext) {
        return new Obj(this.evaluateExpr(evalContext));
    }
    
    getConstraintType(compContext) {
        const factorType = this.exprSeq.getConstraintType(compContext);
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
    
    evaluateHelper(evalContext) {
        return new ObjType(this.evaluateExpr(evalContext));
    }
    
    getConstraintType(compContext) {
        return new TypeType(new ObjType());
    }
}

export class GenericExpr extends SpecialExpr {
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
        this.exprSeq = parser.readExprSeq();
    }
    
    getConstraintType(compContext) {
        const type = this.exprSeq.getConstraintType(compContext);
        const output = type.copy();
        let args;
        if (compContext.genericIsQualified(this)) {
            const argVars = this.getArgVars();
            args = argVars.map((argVar) => compContext.getVarItem(argVar));
        } else {
            args = null;
        }
        const qualification = new GenericQualification(this, args);
        output.qualifications.push(qualification);
        return output;
    }
    
    evaluateHelper(evalContext) {
        return this.exprSeq.evaluateToItem(evalContext);
    }
    
    aggregateCompItems(aggregator) {
        this.exprSeq.aggregateCompItems(aggregator);
    }
    
    convertToJs(jsConverter) {
        return this.exprSeq.convertToJs(jsConverter);
    }
}

export class GenericTypeExpr extends SpecialExpr {
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
        this.exprSeq = parser.readExprSeq();
    }
}

export class DiscernExpr extends ExprSpecialExpr {
    
    evaluateHelper(evalContext) {
        const output = this.evaluateExpr(evalContext);
        evalContext.stowTypeId(this, output.typeId);
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
    method: MethodExpr,
    methodT: MethodTypeExpr,
    await: AwaitExpr,
    interfaceT: InterfaceTypeExpr,
    feature: FeatureValueExpr,
    featureT: FeatureTypeExpr,
    bundle: BundleExpr,
    bundleT: BundleTypeExpr,
    obj: ObjExpr,
    objT: ObjTypeExpr,
    generic: GenericExpr,
    genericT: GenericTypeExpr,
    discern: DiscernExpr,
};


