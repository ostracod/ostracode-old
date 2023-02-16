
import { PreGroup } from "./group.js";
import { GroupSeq } from "./groupSeq.js";

// PreExpr = Pre-expression
// A pre-expression is an expression which has not yet been resolved to a specific type.
export class PreExpr extends PreGroup {
    
    resolveStmts() {
        const resolvedComponents = this.components.map((component) => {
            if (component instanceof GroupSeq) {
                return component.resolveStmts();
            } else {
                return component;
            }
        });
        return new PreExpr(resolvedComponents);
    }
}


