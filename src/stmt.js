
import { PreGroupSeq } from "./preGroup.js";
import { ExprSeq } from "./expr.js";

export class Stmt {
    
    constructor(components) {
        const resolvedComponents = components.map((component) => {
            if (component instanceof PreGroupSeq) {
                return component.resolveStmts(this);
            } else {
                return component;
            }
        });
        this.init(resolvedComponents);
    }
    
    init(components) {
        // Do nothing.
    }
}

export class BhvrStmt extends Stmt {
    
}

export class VarStmt extends BhvrStmt {
    
    init(components) {
        super.init(components);
        // TODO: Throw error if components are invalid.
        this.name = components[1].text;
        const typeExprSeq = components[2];
        let initItemIndex;
        if (typeExprSeq instanceof ExprSeq) {
            this.typeExprSeq = typeExprSeq;
            initItemIndex = 4;
        } else {
            this.typeExprSeq = null;
            initItemIndex = 3;
        }
        if (initItemIndex < components.length) {
            this.initItemExprSeq = components[initItemIndex];
        } else {
            this.initItemExprSeq = null;
        }
    }
}

export class CompVarStmt extends VarStmt {
    
}

export class ImmutEvalVarStmt extends VarStmt {
    
}

export class MutEvalVarStmt extends VarStmt {
    
}

export class AttrStmt extends Stmt {
    
}

export const stmtConstructorMap = {
    comp: CompVarStmt,
    const: ImmutEvalVarStmt,
    var: MutEvalVarStmt,
};

export class StmtSeq {
    
    constructor(stmts) {
        this.stmts = stmts;
    }
}

export class BhvrStmtSeq extends StmtSeq {
    
}

export class AttrStmtSeq extends StmtSeq {
    
}


