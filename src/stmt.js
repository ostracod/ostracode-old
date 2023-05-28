
import * as pathUtils from "path";
import { UnknownItemError } from "./error.js";
import { FlowControl, javaScriptExtension } from "./constants.js";
import * as niceUtils from "./niceUtils.js";
import * as nodeUtils from "./nodeUtils.js";
import * as compUtils from "./compUtils.js";
import { ResolvedGroup } from "./group.js";
import { StmtParser } from "./groupParser.js";
import { CompVar, StmtCompVar, StmtEvalVar, ImportVar } from "./var.js";
import { Package } from "./package.js";
import { SpecialExpr, GenericExpr } from "./specialExpr.js";
import { UnknownItem, AbsentItem } from "./item.js";
import { ItemType, TypeType } from "./itemType.js";

const initItemName = "initialization item";

export class Stmt extends ResolvedGroup {
    
    constructor(components) {
        super(components);
        const parser = new StmtParser(components, this);
        if (this.isKeywordStmt()) {
            parser.index += 1;
        }
        this.tryOperation(() => {
            this.init(parser);
        });
        parser.assertEnd("statement");
    }
    
    init(parser) {
        // Do nothing.
    }
    
    isKeywordStmt() {
        return true;
    }
    
    getAttrStmt(attrStmtClass) {
        return nodeUtils.getAttrStmt(this.attrStmtSeq, attrStmtClass);
    }
    
    resolveChild(preStmt) {
        return null;
    }
    
    resolveStmts() {
        for (const groupSeq of this.children) {
            groupSeq.resolveStmts();
        }
    }
    
    getParentVars() {
        return [];
    }
    
    hasExportedStmt() {
        return (this.getAttrStmt(ExportedStmt) !== null);
    }
    
    iterateCompItems(compContext, handle) {
        // Do nothing.
    }
}

export class BhvrStmt extends Stmt {
    // Concrete subclasses of BhvrStmt must implement these methods:
    // evaluate
    
    evaluate(evalContext) {
        this.throwError("Evaluation is not yet supported for this type of statement.");
    }
}

export class VarStmt extends BhvrStmt {
    // Concrete subclasses of VarStmt must implement these methods:
    // getVarConstructor
    
    readInitItem(parser) {
        return parser.readExprSeq(initItemName);
    }
    
    init(parser) {
        this.name = parser.readIdentifierText();
        const varConstructor = this.getVarConstructor();
        this.variable = new varConstructor(this.name, this);
        this.typeExprSeq = parser.readCompExprSeq("constraint type", false, true);
        this.attrStmtSeq = parser.readAttrStmtSeq();
        if (parser.hasReachedEnd()) {
            this.initItemExprSeq = null;
        } else {
            parser.readEqualSign();
            this.initItemExprSeq = this.readInitItem(parser);
        }
    }
    
    getParentVars() {
        return [this.variable];
    }
    
    getConstraintType(compContext) {
        if (this.typeExprSeq !== null) {
            return compContext.getSeqItem(this.typeExprSeq);
        } else if (this.initItemExprSeq !== null) {
            return this.initItemExprSeq.getConstraintType(compContext);
        } else {
            return new ItemType();
        }
    }
    
    validateTypes(compContext) {
        if (this.typeExprSeq !== null && this.initItemExprSeq !== null) {
            const varType = compContext.getSeqItem(this.typeExprSeq);
            const initItemType = this.initItemExprSeq.getConstraintType(compContext);
            compUtils.validateKnownItems([varType, initItemType]);
            if (!varType.contains(initItemType)) {
                this.throwError("Initialization item type does not conform to variable type.");
            }
        }
        super.validateTypes(compContext);
    }
}

export class CompVarStmt extends VarStmt {
    
    readInitItem(parser) {
        return parser.readCompExprSeq(initItemName);
    }
    
    getVarConstructor() {
        return StmtCompVar;
    }
    
    resolveCompItem(compContext) {
        if (this.initItemExprSeq === null) {
            this.throwError("Comptime variable has no initialization item.");
        }
        return compContext.getSeqItem(this.initItemExprSeq);
    }
    
    evaluate(evalContext) {
        return { flowControl: FlowControl.None };
    }
    
    convertToJs(jsConverter) {
        return "";
    }
}

export class EvalVarStmt extends VarStmt {
    
    getVarConstructor() {
        return StmtEvalVar;
    }
    
    evaluate(evalContext) {
        if (this.initItemExprSeq !== null) {
            const itemRef = evalContext.getRef(this.name);
            itemRef.write(this.initItemExprSeq.evaluateToItem(evalContext));
        }
        return { flowControl: FlowControl.None };
    }
    
    iterateCompItems(compContext, handle) {
        if (this.initItemExprSeq !== null) {
            this.initItemExprSeq.iterateCompItems(compContext, handle);
        }
    }
    
    convertToJs(jsConverter) {
        const codeList = [];
        if (this.variable.isExported()) {
            codeList.push("export ");
        }
        codeList.push(this.getJsKeyword() + " " + this.variable.getJsIdentifier());
        if (this.initItemExprSeq !== null) {
            codeList.push(" = ");
            codeList.push(this.initItemExprSeq.convertToJs(jsConverter));
        }
        codeList.push(";");
        return codeList.join("");
    }
}

export class ImmutEvalVarStmt extends EvalVarStmt {
    
    getJsKeyword() {
        return "const";
    }
}

export class MutEvalVarStmt extends EvalVarStmt {
    
    getJsKeyword() {
        return "let";
    }
}

export class ExprStmt extends BhvrStmt {
    
    init(parser) {
        this.exprSeq = parser.readExprSeq("expression sequence");
    }
    
    isKeywordStmt() {
        return false;
    }
    
    evaluate(evalContext) {
        this.exprSeq.evaluate(evalContext);
        return { flowControl: FlowControl.None };
    }
    
    iterateCompItems(compContext, handle) {
        this.exprSeq.iterateCompItems(compContext, handle);
    }
    
    convertToJs(jsConverter) {
        return this.exprSeq.convertToJs(jsConverter) + ";";
    }
}

export class ScopeStmt extends BhvrStmt {
    
    init(parser) {
        this.stmtSeq = parser.readBhvrStmtSeq();
    }
    
    isKeywordStmt() {
        return false;
    }
    
    evaluate(evalContext) {
        return this.stmtSeq.evaluate(evalContext);
    }
    
    iterateCompItems(compContext, handle) {
        this.stmtSeq.iterateCompItems(compContext, handle);
    }
    
    convertToJs(jsConverter) {
        return this.stmtSeq.convertToJs(jsConverter);
    }
}

export class IfStmt extends BhvrStmt {
    
    init(parser) {
        this.ifClause = parser.readIfClause();
        this.elseIfClauses = [];
        this.elseStmtSeq = null;
        while (!parser.hasReachedEnd()) {
            const keyword = parser.readKeyword(["elseIf", "else"]);
            if (keyword === "elseIf") {
                const clause = parser.readIfClause();
                this.elseIfClauses.push(clause);
            } else if (keyword === "else") {
                this.elseStmtSeq = parser.readBhvrStmtSeq();
                break;
            }
        }
    }
}

export class WhileStmt extends BhvrStmt {
    
    init(parser) {
        this.condExprSeq = parser.readExprSeq("condition");
        this.stmtSeq = parser.readBhvrStmtSeq();
    }
}

export class ForStmt extends BhvrStmt {
    
    init(parser) {
        this.varName = parser.readIdentifierText();
        this.variable = new StmtEvalVar(this.varName, this);
        parser.readKeyword(["in"]);
        this.iterableExprSeq = parser.readExprSeq("iterable");
        this.stmtSeq = parser.readBhvrStmtSeq();
    }
    
    resolveVars() {
        this.stmtSeq.addVar(this.variable);
    }
}

export class BreakStmt extends BhvrStmt {
    
}

export class ContinueStmt extends BhvrStmt {
    
}

export class ReturnStmt extends BhvrStmt {
    
    init(parser) {
        this.exprSeq = parser.readExprSeq("return item", true);
    }
    
    evaluate(evalContext) {
        let returnItem;
        if (this.exprSeq === null) {
            returnItem = undefined;
        } else {
            returnItem = this.exprSeq.evaluateToItem(evalContext);
        }
        return { flowControl: FlowControl.Return, returnItem, stmt: this };
    }
    
    iterateCompItems(compContext, handle) {
        if (this.exprSeq !== null) {
            this.exprSeq.iterateCompItems(compContext, handle);
        }
    }
    
    convertToJs(jsConverter) {
        if (this.exprSeq === null) {
            return "return;";
        } else {
            return `return ${this.exprSeq.convertToJs(jsConverter)};`;
        }
    }
}

export class TryStmt extends BhvrStmt {
    
    init(parser) {
        this.stmtSeq = parser.readBhvrStmtSeq();
        const catchKeyword = parser.readKeyword(["catch"], ["finally"], true);
        if (catchKeyword === null) {
            this.varName = null;
            this.variable = null;
            this.catchStmtSeq = null;
        } else {
            this.varName = parser.readIdentifierText();
            this.variable = new StmtEvalVar(this.varName, this);
            this.catchStmtSeq = parser.readBhvrStmtSeq();
        }
        const finallyKeyword = parser.readKeyword(["finally"], [], true);
        if (finallyKeyword === null) {
            this.finallyStmtSeq = null;
        } else {
            this.finallyStmtSeq = parser.readBhvrStmtSeq();
        }
        if (this.catchStmtSeq === null && this.finallyStmtSeq === null) {
            this.throwError("Expected catch or finally clause.");
        }
    }
    
    resolveVars() {
        if (this.variable !== null && this.catchStmtSeq !== null) {
            this.catchStmtSeq.addVar(this.variable);
        }
    }
}

export class ThrowStmt extends BhvrStmt {
    
    init(parser) {
        this.exprSeq = parser.readExprSeq("error item");
    }
}

export class ImportStmt extends BhvrStmt {
    // Concrete subclasses of ImportStmt must implement these methods:
    // getExprErrorName, getImportedFile, getJsSpecifier
    
    init(parser) {
        this.specifierExprSeq = parser.readCompExprSeq(this.getExprErrorName());
        const hasKeyword = parser.readAsKeyword();
        if (hasKeyword) {
            this.name = parser.readIdentifierText();
            this.variable = new StmtEvalVar(this.name, this);
        } else {
            this.name = null;
            this.variable = null;
        }
        this.typeExprSeq = parser.readCompExprSeq("module type", false, true);
        this.attrStmtSeq = parser.readAttrStmtSeq();
    }
    
    getParentVars() {
        const output = [];
        if (this.variable !== null) {
            output.push(this.variable);
        }
        const membersStmt = this.getAttrStmt(ImportMembersStmt);
        if (membersStmt !== null) {
            niceUtils.extendList(output, membersStmt.getChildVars());
        }
        return output;
    }
    
    getSpecifier(compContext) {
        const specifier = compContext.getSeqItem(this.specifierExprSeq);
        if (specifier instanceof UnknownItem) {
            throw new UnknownItemError(specifier);
        }
        return specifier;
    }
    
    convertToJs(jsConverter) {
        const compContext = jsConverter.getCompContext();
        const specifier = this.getJsSpecifier(compContext);
        const lines = [];
        if (this.variable !== null) {
            lines.push(`import * as ${this.variable.getJsIdentifier()} from "${specifier}";`);
        }
        const membersStmt = this.getAttrStmt(ImportMembersStmt);
        if (membersStmt !== null) {
            const memberStmts = membersStmt.getChildStmts();
            const phrases = [];
            for (const memberStmt of memberStmts) {
                const phrase = memberStmt.convertToJs(jsConverter);
                if (phrase !== null) {
                    phrases.push(phrase);
                }
            }
            if (phrases.length > 0) {
                lines.push(`import { ${phrases.join(", ")} } from "${specifier}";`);
            }
        }
        if (lines.length <= 0) {
            lines.push(`import "${specifier}";`);
        }
        return lines.join("\n");
    }
}

export class ImportPathStmt extends ImportStmt {
    
    getExprErrorName() {
        return "file path";
    }
    
    getImportedPath(compContext) {
        const path = this.getSpecifier(compContext);
        const packageNode = this.getParent(Package);
        return pathUtils.resolve(pathUtils.join(packageNode.srcPath, path));
    }
    
    getImportedFile(compContext) {
        const srcPath = this.getImportedPath(compContext);
        const packageNode = this.getParent(Package);
        for (const ostraCodeFile of packageNode.children) {
            if (ostraCodeFile.srcPath === srcPath) {
                return ostraCodeFile;
            }
        }
        this.throwError(`Could not find source file with path "${srcPath}".`);
    }
    
    getJsSpecifier(compContext) {
        const srcPath = this.getImportedPath(compContext);
        const codeFile = this.getOstraCodeFile();
        const dirPath = pathUtils.dirname(codeFile.srcPath);
        const relativePath = pathUtils.relative(dirPath, srcPath);
        return "./" + niceUtils.replaceExtension(relativePath, javaScriptExtension);
    }
}

export class ImportPackageStmt extends ImportStmt {
    
    getExprErrorName() {
        return "package name";
    }
    
    getImportedFile(compContext) {
        // TODO: Implement.
    }
}

export const bhvrStmtConstructors = {
    comp: CompVarStmt,
    const: ImmutEvalVarStmt,
    mutable: MutEvalVarStmt,
    if: IfStmt,
    while: WhileStmt,
    for: ForStmt,
    break: BreakStmt,
    continue: ContinueStmt,
    return: ReturnStmt,
    try: TryStmt,
    throw: ThrowStmt,
    importPath: ImportPathStmt,
    importPackage: ImportPackageStmt,
};

export class AttrStmt extends Stmt {
    
}

export class ExprAttrStmt extends AttrStmt {
    // Concrete subclasses of ExprAttrStmt must implement these methods:
    // getErrorName
    
    init(parser) {
        this.exprSeq = parser.readExprSeq(this.getErrorName());
    }
}

export class ElemTypeStmt extends ExprAttrStmt {
    
    getErrorName() {
        return "element type";
    }
}

export class LengthStmt extends ExprAttrStmt {
    
    getErrorName() {
        return "length";
    }
}

export class ParentAttrStmt extends AttrStmt {
    // Concrete subclasses of ParentAttrStatement must implement these methods:
    // getChildConstructor
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
    }
    
    resolveChild(preStmt) {
        const childConstructor = this.getChildConstructor();
        return new childConstructor(preStmt.components);
    }
    
    getChildStmts() {
        return (this.attrStmtSeq === null) ? [] : this.attrStmtSeq.groups;
    }
    
    getChildVars() {
        return this.getChildStmts().map((stmt) => stmt.getChildVar());
    }
}

export class ArgsStmt extends ParentAttrStmt {
    
    getChildConstructor() {
        return ArgStmt;
    }
}

export class AsyncStmt extends AttrStmt {
    
}

export class ReturnsStmt extends ExprAttrStmt {
    
    getErrorName() {
        return "return type";
    }
}

export class ChildAttrStmt extends AttrStmt {
    
    isKeywordStmt() {
        return false;
    }
}

export class ArgStmt extends ChildAttrStmt {
    
    init(parser) {
        this.name = parser.readIdentifierText();
        this.typeExprSeq = parser.readExprSeq();
        this.attrStmtSeq = parser.readAttrStmtSeq();
        if (parser.hasReachedEnd()) {
            this.defaultItemExprSeq = null;
        } else {
            parser.readEqualSign();
            this.defaultItemExprSeq = parser.readExprSeq("default item");
        }
        this.variable = null;
    }
    
    getChildVar() {
        if (this.variable === null) {
            const parentSpecial = this.getParent(SpecialExpr);
            let varConstructor;
            if (parentSpecial instanceof GenericExpr) {
                varConstructor = StmtCompVar;
            } else {
                varConstructor = StmtEvalVar;
            }
            this.variable = new varConstructor(this.name, this);
        }
        return this.variable;
    }
    
    resolveCompItem(compContext) {
        const type = this.getConstraintType(compContext);
        compUtils.validateKnownItems([type]);
        if (type instanceof TypeType) {
            const nestedType = type.type;
            compUtils.validateKnownItems([nestedType]);
            return nestedType.nominate();
        } else {
            return new AbsentItem();
        }
    }
    
    getDefaultCompItem(compContext) {
        if (this.defaultItemExprSeq === null) {
            return new AbsentItem();
        } else {
            return compContext.getSeqItem(this.defaultItemExprSeq);
        }
    }
    
    getConstraintType(compContext) {
        if (this.typeExprSeq !== null) {
            return compContext.getSeqItem(this.typeExprSeq);
        } else if (this.defaultItemExprSeq !== null) {
            return this.defaultItemExprSeq.getConstraintType(compContext);
        } else {
            return new ItemType();
        }
    }
}

export class FieldTypeStmt extends ExprAttrStmt {
    
    getErrorName() {
        return "field type";
    }
}

export class FieldsStmt extends ParentAttrStmt {
    
    getChildConstructor() {
        return FieldStmt;
    }
}

export class ItemFieldsStmt extends FieldsStmt {}

export class SharedFieldsStmt extends FieldsStmt {}

export class FieldStmt extends ChildAttrStmt {
    
    init(parser) {
        this.nameExprSeq = parser.readExprSeq();
        if (this.nameExprSeq === null) {
            this.name = parser.readIdentifierText("name identifier or expression");
        } else {
            this.name = null;
        }
        this.typeExprSeq = parser.readExprSeq();
        this.attrStmtSeq = parser.readAttrStmtSeq();
        if (parser.hasReachedEnd()) {
            this.initItemExprSeq = null;
        } else {
            parser.readEqualSign();
            this.initItemExprSeq = parser.readExprSeq("init item");
        }
    }
    
    getJsIdentifier() {
        return compUtils.getJsIdentifier(this.name);
    }
    
    iterateCompItems(compContext, handle) {
        if (this.initItemExprSeq !== null) {
            this.initItemExprSeq.iterateCompItems(compContext, handle);
        }
    }
    
    getInitItemCode(jsConverter) {
        if (this.initItemExprSeq === null) {
            return "undefined";
        } else {
            return this.initItemExprSeq.convertToJs(jsConverter);
        }
    }
    
    convertToDictJs(jsConverter) {
        const initItemCode = this.getInitItemCode(jsConverter);
        return `${this.getJsIdentifier()}: ${initItemCode},`;
    }
    
    convertToSharedJs(jsConverter) {
        const initItemCode = this.getInitItemCode(jsConverter);
        return `${this.getJsIdentifier()} = ${initItemCode};`;
    }
    
    convertToItemJs(jsConverter) {
        return "this." + this.convertToSharedJs(jsConverter);
    }
}

export class OptionalStmt extends AttrStmt {
    
}

export class SelfFeatureStmt extends ExprAttrStmt {
    
    getErrorName() {
        return "feature type";
    }
}

export class ThisFactorsStmt extends ExprAttrStmt {
    
    getErrorName() {
        return "factor type";
    }
}

export class FactorsStmt extends ParentAttrStmt {
    
    getChildConstructor() {
        return FactorStmt;
    }
}

export class FactorStmt extends ChildAttrStmt {
    
    init(parser) {
        this.exprSeq = parser.readExprSeq("factor");
        this.attrStmtSeq = parser.readAttrStmtSeq();
    }
}

export class PermStmt extends AttrStmt {}

export class AccessPermStmt extends PermStmt {}

export class PublicStmt extends AccessPermStmt {}

export class ProtectedStmt extends AccessPermStmt {}

export class PrivateStmt extends AccessPermStmt {}

export class GetPermStmt extends PermStmt {}

export class PublicGetStmt extends GetPermStmt {}

export class ProtectedGetStmt extends GetPermStmt {}

export class PrivateGetStmt extends GetPermStmt {}

export class SetPermStmt extends PermStmt {}

export class PublicSetStmt extends SetPermStmt {}

export class ProtectedSetStmt extends SetPermStmt {}

export class PrivateSetStmt extends SetPermStmt {}

export class VisStmt extends ExprAttrStmt {
    
    getErrorName() {
        return "visibility number";
    }
}

export class ShieldStmt extends ExprAttrStmt {
    
    getErrorName() {
        return "shield number";
    }
}

export class ImplementsStmt extends ExprAttrStmt {
    
    getErrorName() {
        return "type expression sequence";
    }
}

export class ModuleMembersStmt extends ParentAttrStmt {
    
    getChildConstructor() {
        return ModuleMemberStmt;
    }
}

export class ComptimeMembersStmt extends ModuleMembersStmt {
    
}

export class RuntimeMembersStmt extends ModuleMembersStmt {
    
}

export class ModuleMemberStmt extends ChildAttrStmt {
    
    init(parser) {
        this.name = parser.readIdentifierText();
        this.typeExprSeq = parser.readExprSeq("constraint type", true);
    }
}

export class ExportedStmt extends AttrStmt {
    
}

export class ForeignStmt extends AttrStmt {
    
}

export class ImportMembersStmt extends ParentAttrStmt {
    
    getChildConstructor() {
        return ImportMemberStmt;
    }
}

export class ImportMemberStmt extends ChildAttrStmt {
    
    init(parser) {
        this.name = parser.readIdentifierText();
        const hasKeyword = parser.readAsKeyword();
        if (hasKeyword) {
            this.aliasName = parser.readIdentifierText();
        } else {
            this.aliasName = this.name;
        }
        this.variable = new ImportVar(this.aliasName, this);
        this.typeExprSeq = parser.readCompExprSeq("constraint type", false, true);
        this.attrStmtSeq = parser.readAttrStmtSeq();
    }
    
    getChildVar() {
        return this.variable;
    }
    
    getImportStmt() {
        return this.getParent(ImportStmt);
    }
    
    getConstraintType(compContext) {
        return (this.typeExprSeq === null) ? null : compContext.getSeqItem(this.typeExprSeq);
    }
    
    convertToJs(jsConverter) {
        const unwrappedVar = this.variable.unwrap(jsConverter.getCompContext());
        if (unwrappedVar instanceof CompVar) {
            return null;
        }
        const jsIdentifier = this.variable.getJsIdentifier();
        if (this.name === this.aliasName) {
            return jsIdentifier;
        } else {
            return compUtils.getJsIdentifier(this.name) + " as " + jsIdentifier;
        }
    }
}

export const attrStmtConstructors = {
    elemType: ElemTypeStmt,
    length: LengthStmt,
    args: ArgsStmt,
    async: AsyncStmt,
    returns: ReturnsStmt,
    fieldType: FieldTypeStmt,
    fields: FieldsStmt,
    itemFields: ItemFieldsStmt,
    sharedFields: SharedFieldsStmt,
    optional: OptionalStmt,
    selfFeature: SelfFeatureStmt,
    thisFactor: ThisFactorsStmt,
    factors: FactorsStmt,
    public: PublicStmt,
    protected: ProtectedStmt,
    private: PrivateStmt,
    publicGet: PublicGetStmt,
    protectedGet: ProtectedGetStmt,
    privateGet: PrivateGetStmt,
    publicSet: PublicSetStmt,
    protectedSet: ProtectedSetStmt,
    privateSet: PrivateSetStmt,
    vis: VisStmt,
    shield: ShieldStmt,
    implements: ImplementsStmt,
    comptimeMembers: ComptimeMembersStmt,
    runtimeMembers: RuntimeMembersStmt,
    exported: ExportedStmt,
    foreign: ForeignStmt,
    members: ImportMembersStmt,
};


