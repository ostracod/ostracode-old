
import { UnknownItemError } from "./error.js";
import * as nodeUtils from "./nodeUtils.js";
import { AttrStmtSeq } from "./groupSeq.js";
import { ArgsStmt, ItemFieldsStmt, SharedFieldsStmt, ElemTypeStmt, KeyStmt } from "./stmt.js";
import { Expr } from "./expr.js";
import { SpecialParser } from "./groupParser.js";
import { CustomFunc, UnboundCustomMethod } from "./func.js";
import { UnknownItem, UnresolvedItem } from "./item.js";
import { ItemType, TypeType, ListType } from "./itemType.js";
import { ResultRef } from "./itemRef.js";
import { ReflexiveVar } from "./var.js";
import { Feature } from "./factor.js";
import { FeatureType } from "./factorType.js";
import { Obj, ObjType } from "./obj.js";
import { CompContext } from "./compContext.js";
import { AnchorType } from "./anchor.js";

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
        this.exprSeq = parser.readExprSeq(true, this.exprSeqMayBeNull());
    }
    
    exprSeqMayBeNull() {
        return false;
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
            elemType = new ItemType();
        } else {
            elemType = compContext.getSeqItem(elemTypeStmt.exprSeq);
        }
        let elemTypes;
        if (this.exprSeq === null) {
            elemTypes = null;
        } else {
            elemTypes = this.exprSeq.getConstraintTypes(compContext);
        }
        return new ListType(elemType, elemTypes);
    }
    
    evaluateHelper(evalContext) {
        if (this.exprSeq === null) {
            return [];
        } else {
            return this.exprSeq.evaluateToItems(evalContext);
        }
    }
    
    iterateCompItems(compContext, handle) {
        if (this.exprSeq !== null) {
            this.exprSeq.iterateCompItems(compContext, handle);
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
    
    getConstraintType(compContext) {
        return new TypeType(new ListType());
    }
    
    evaluateHelper(evalContext) {
        const elemTypeStmt = this.getAttrStmt(ElemTypeStmt);
        let elemType;
        if (elemTypeStmt === null) {
            elemType = new ItemType();
        } else {
            elemType = elemTypeStmt.exprSeq.evaluateToItem(evalContext);
        }
        let elemTypes;
        if (this.exprSeq === null) {
            elemTypes = null;
        } else {
            elemTypes = this.exprSeq.evaluateToItems(evalContext);
        }
        return new ListType(elemType, elemTypes);
    }
    
    iterateCompItems(compContext, handle) {
        const elemTypeStmt = this.getAttrStmt(ElemTypeStmt);
        if (elemTypeStmt !== null) {
            elemTypeStmt.exprSeq.iterateCompItems(compContext, handle);
        }
        if (this.exprSeq !== null) {
            this.exprSeq.iterateCompItems(compContext, handle);
        }
    }
}

export class DictExpr extends AttrsSpecialExpr {}

export class DictTypeExpr extends AttrsSpecialExpr {}

export class InvocableExpr extends SpecialExpr {
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
        this.bhvrStmtSeq = parser.readBhvrStmtSeq();
    }
    
    iterateCompItems(compContext, handle) {
        this.bhvrStmtSeq.iterateCompItems(compContext, handle);
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
        this.selfVar = new ReflexiveVar("self", this.getFeatureExpr());
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
    
    constructor(components, groupSeqs) {
        super(components, groupSeqs);
        const keyStmt = this.getAttrStmt(KeyStmt);
        this.keyExprSeq = (keyStmt === null) ? null : keyStmt.exprSeq;
        this.itemFieldStmts = this.getAttrStmtChildren(ItemFieldsStmt);
        this.sharedFieldStmts = this.getAttrStmtChildren(SharedFieldsStmt);
    }
}

export class FeatureValueExpr extends FeatureExpr {
    
    getAnchor(compContext) {
        if (this.keyExprSeq === null) {
            return null;
        } else {
            return compContext.getSeqItem(this.keyExprSeq);
        }
    }
    
    evaluateHelper(evalContext) {
        return new Feature(this, evalContext);
    }
    
    getConstraintType(compContext) {
        const anchor = this.getAnchor(compContext);
        return new FeatureType(this, anchor);
    }
    
    iterateCompItems(compContext, handle) {
        for (const fieldStmt of this.itemFieldStmts) {
            fieldStmt.iterateCompItems(compContext, handle);
        }
        for (const fieldStmt of this.sharedFieldStmts) {
            fieldStmt.iterateCompItems(compContext, handle);
        }
    }
    
    convertToJs(jsConverter) {
        const itemFieldCodeList = this.itemFieldStmts.map((stmt) => (
            stmt.convertToItemJs(jsConverter)
        ));
        const sharedFieldCodeList = this.sharedFieldStmts.map((stmt) => (
            stmt.convertToSharedJs(jsConverter)
        ));
        const anchor = this.getAnchor(jsConverter.getCompContext());
        return `(() => {
const feature = class extends classes.Feature {
static key = ${(anchor === null) ? "Symbol()" : anchor.variable.getJsIdentifier()};
constructor(obj) {
super(obj);
${itemFieldCodeList.join("\n")}
}
${sharedFieldCodeList.join("\n")}
};
return feature;
})()`;
    }
}

export class FeatureTypeExpr extends FeatureExpr {
    
    evaluateHelper(evalContext) {
        let anchor;
        if (this.keyExprSeq === null) {
            anchor = null;
        } else {
            anchor = this.keyExprSeq.evaluateToItem(evalContext);
        }
        return new FeatureType(this, anchor);
    }
    
    getConstraintType(compContext) {
        return new TypeType(new FeatureType(this));
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
    
    iterateCompItems(compContext, handle) {
        this.exprSeq.iterateCompItems(compContext, handle);
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
        const argsContext = new CompContext(this.exprSeq, compContext);
        for (const argStmt of this.getAttrStmtChildren(ArgsStmt)) {
            const item = argStmt.getDefaultCompItem(compContext);
            if (item instanceof UnresolvedItem) {
                throw new UnknownItemError(item);
            }
            argsContext.varItemMap.set(argStmt.variable, item);
        }
        argsContext.resolveCompItems();
        const type = this.exprSeq.getConstraintType(argsContext);
        const output = type.copy();
        output.genericExpr = this;
        return output;
    }
    
    evaluateHelper(evalContext) {
        return this.exprSeq.evaluateToItem(evalContext);
    }
    
    iterateCompItems(compContext, handle) {
        this.exprSeq.iterateCompItems(compContext, handle);
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

export class AnchorTypeExpr extends ExprSpecialExpr {
    
    exprSeqMayBeNull() {
        return true;
    }
    
    evaluateHelper(evalContext) {
        if (this.exprSeq === null) {
            return new AnchorType();
        } else {
            return new AnchorType(this.evaluateExpr(evalContext));
        }
    }
    
    getConstraintType(compContext) {
        return new TypeType(new AnchorType());
    }
}

export class DiscernExpr extends SpecialExpr {
    
    init(parser) {
        this.featureExprSeq = parser.readExprSeq(true);
        this.anchorExprSeq = parser.readExprSeq(true);
    }
    
    getAnchor(compContext) {
        return compContext.getSeqItem(this.anchorExprSeq);
    }
    
    getConstraintType(compContext) {
        const featureType = this.featureExprSeq.getConstraintType(compContext);
        const output = featureType.copy();
        output.setAnchor(this.getAnchor(compContext));
        return output;
    }
    
    evaluateHelper(evalContext) {
        const feature = this.featureExprSeq.evaluateToItem(evalContext);
        const anchor = this.getAnchor(evalContext.compContext);
        if (anchor instanceof UnknownItem) {
            throw new UnknownItemError(anchor);
        }
        evalContext.derefAnchor(anchor).write(feature.key);
        return feature;
    }
    
    iterateCompItems(compContext, handle) {
        this.featureExprSeq.iterateCompItems(compContext, handle);
    }
    
    convertToJs(jsConverter) {
        const anchor = this.getAnchor(jsConverter.getCompContext());
        const featureCode = this.featureExprSeq.convertToJs(jsConverter);
        return `(() => { const feature = ${featureCode}; ${anchor.variable.getJsIdentifier()} = feature.key; return feature; })()`;
    }
}

export class ModuleTypeExpr extends AttrsSpecialExpr {}

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
    anchorT: AnchorTypeExpr,
    discern: DiscernExpr,
    moduleT: ModuleTypeExpr,
};


