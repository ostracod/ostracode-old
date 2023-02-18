
import { CompilerError } from "./error.js";
import { ResolvedGroup } from "./group.js";
import { GroupSeq } from "./groupSeq.js";
import { GroupParser } from "./parser.js";

const initItemName = "initialization item";

export class Stmt extends ResolvedGroup {
    
    constructor(components) {
        super(components);
        const parser = new GroupParser(this, components);
        if (this.isKeywordStmt()) {
            parser.index += 1;
        }
        try {
            this.init(parser);
        } catch (error) {
            if (error instanceof CompilerError && error.lineNumber === null) {
                error.lineNumber = this.getLineNumber();
            }
            throw error;
        }
        parser.assertEnd("statement");
    }
    
    init(parser) {
        // Do nothing.
    }
    
    isKeywordStmt() {
        return true;
    }
    
    resolveChild(preStmt) {
        return null;
    }
    
    resolveStmts() {
        for (const groupSeq of this.children) {
            groupSeq.resolveStmts();
        }
    }
}

export class BhvrStmt extends Stmt {
    
}

export class VarStmt extends BhvrStmt {
    
    readInitItem(parser) {
        return parser.readExprSeq(initItemName);
    }
    
    init(parser) {
        this.name = parser.readIdentifierText();
        this.typeExprSeq = parser.readCompExprSeq("constraint type", false, true);
        this.attrStmtSeq = parser.readAttrStmtSeq();
        if (parser.hasReachedEnd()) {
            this.initItemExprSeq = null;
        } else {
            parser.readEqualSign();
            this.initItemExprSeq = this.readInitItem(parser);
        }
    }
}

export class CompVarStmt extends VarStmt {
    
    readInitItem(parser) {
        return parser.readCompExprSeq(initItemName);
    }
}

export class ImmutEvalVarStmt extends VarStmt {
    
}

export class MutEvalVarStmt extends VarStmt {
    
}

export class ExprStmt extends BhvrStmt {
    
    init(parser) {
        this.exprSeq = parser.readComponent();
    }
    
    isKeywordStmt() {
        return false;
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
        parser.readKeyword(["in"]);
        this.iterableExprSeq = parser.readExprSeq("iterable");
        this.stmtSeq = parser.readBhvrStmtSeq();
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
}

export class TryStmt extends BhvrStmt {
    
    init(parser) {
        this.stmtSeq = parser.readBhvrStmtSeq();
        const catchKeyword = parser.readKeyword(["catch"], ["finally"], true);
        if (catchKeyword === null) {
            this.varName = null;
            this.catchStmtSeq = null;
        } else {
            this.varName = parser.readIdentifierText();
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
}

export class ThrowStmt extends BhvrStmt {
    
    init(parser) {
        this.exprSeq = parser.readExprSeq("error item");
    }
}

export class ImportStmt extends BhvrStmt {
    // Concrete subclasses of ImportStmt must implement these methods:
    // getExprErrorName
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
        this.exprSeq = parser.readCompExprSeq(this.getExprErrorName());
    }
}

export class ImportPathStmt extends ImportStmt {
    
    getExprErrorName() {
        return "file path";
    }
}

export class ImportPackageStmt extends ImportStmt {
    
    getExprErrorName() {
        return "package name";
    }
}

export const bhvrStmtConstructors = {
    comp: CompVarStmt,
    const: ImmutEvalVarStmt,
    var: MutEvalVarStmt,
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
}

export class OptionalStmt extends AttrStmt {
    
}

export class MethodsStmt extends ParentAttrStmt {
    
    getChildConstructor() {
        return MethodStmt;
    }
}

export class MethodStmt extends ChildAttrStmt {
    
    init(parser) {
        this.name = parser.readIdentifierText();
        this.attrStmtSeq = parser.readAttrStmtSeq();
        this.bhvrStmtSeq = parser.readBhvrStmtSeq(true);
    }
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

export class TypeArgsStmt extends ParentAttrStmt {
    
    getChildConstructor() {
        return ArgStmt;
    }
}

export class ExportedStmt extends AttrStmt {
    
}

export class ForeignStmt extends AttrStmt {
    
}

export class AsStmt extends AttrStmt {
    
    init(parser) {
        this.name = parser.readIdentifierText();
    }
}

export class MembersStmt extends ParentAttrStmt {
    
    getChildConstructor() {
        return MemberStmt;
    }
}

export class MemberStmt extends ChildAttrStmt {
    
    init(parser) {
        this.name = parser.readIdentifierText();
        this.typeExprSeq = parser.readCompExprSeq("constraint type", false, true);
        if (parser.hasReachedEnd()) {
            this.aliasName = this.name;
        } else {
            parser.readKeyword(["as"]);
            this.aliasName = parser.readIdentifierText();
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
    optional: OptionalStmt,
    methods: MethodsStmt,
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
    typeArgs: TypeArgsStmt,
    exported: ExportedStmt,
    foreign: ForeignStmt,
    as: AsStmt,
    members: MembersStmt,
};


