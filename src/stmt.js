
import { CompilerError } from "./error.js";
import { WordToken, OperatorToken } from "./token.js";
import { PreGroupSeq } from "./preGroup.js";
import { Group, GroupSeq } from "./group.js";
import { ExprSeq } from "./expr.js";
import { GroupParser } from "./parser.js";

const initItemName = "initialization item";

export class Stmt extends Group {
    
    constructor(components) {
        super(components);
        const resolvedComponents = components.map((component) => {
            if (component instanceof PreGroupSeq) {
                return component.resolveStmts(this);
            } else {
                return component;
            }
        });
        const parser = new GroupParser(resolvedComponents);
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
        parser.assertEnd("statement")
    }
    
    init(parser) {
        // Do nothing.
    }
    
    isKeywordStmt() {
        return true;
    }
}

export class BhvrStmt extends Stmt {
    
}

export class VarStmt extends BhvrStmt {
    
    readInitItem(parser) {
        return parser.readByClass(ExprSeq, initItemName);
    }
    
    init(parser) {
        this.name = parser.readIdentifierText();
        this.typeExprSeq = parser.readCompExprSeq("constraint type", false, true);
        this.attrStmtSeq = parser.readAttrStmtSeq();
        if (parser.hasReachedEnd()) {
            this.initItemExprSeq = null;
            return;
        }
        parser.readEqualSign();
        this.initItemExprSeq = this.readInitItem(parser);
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
        this.condExprSeq = parser.readByClass(ExprSeq, "condition");
        this.stmtSeq = parser.readBhvrStmtSeq();
    }
}

export class ForStmt extends BhvrStmt {
    
    init(parser) {
        this.varName = parser.readIdentifierText();
        parser.readKeyword(["in"]);
        this.iterableExprSeq = parser.readByClass(ExprSeq, "iterable");
        this.stmtSeq = parser.readBhvrStmtSeq();
    }
}

export class BreakStmt extends BhvrStmt {
    
}

export class ContinueStmt extends BhvrStmt {
    
}

export class ReturnStmt extends BhvrStmt {
    
    init(parser) {
        this.exprSeq = parser.readByClass(ExprSeq, "return item", true);
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
        this.exprSeq = parser.readByClass(ExprSeq, "error item");
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
        this.exprSeq = parser.readByClass(ExprSeq, this.getErrorName());
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

export class ArgsStmt extends AttrStmt {
    
    init(parser) {
        this.attrStmtSeq = parser.readAttrStmtSeq();
    }
}

export class AsyncStmt extends AttrStmt {
    
}

export class ReturnsStmt extends ExprAttrStmt {
    
    getErrorName() {
        return "return type";
    }
}

export const attrStmtConstructors = {
    elemType: ElemTypeStmt,
    length: LengthStmt,
    args: ArgsStmt,
    async: AsyncStmt,
    returns: ReturnsStmt,
};

export class StmtSeq extends GroupSeq {
    
}

export class BhvrStmtSeq extends StmtSeq {
    
}

export class AttrStmtSeq extends StmtSeq {
    
}


