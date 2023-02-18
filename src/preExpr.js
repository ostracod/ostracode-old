
import { PreGroup } from "./group.js";
import { GroupSeq } from "./groupSeq.js";
import { ExprParser } from "./groupParser.js";

// PreExpr = Pre-expression
// A pre-expression is an expression which has not yet been resolved to a specific type.
export class PreExpr extends PreGroup {
    
    resolveStmts() {
        for (const component of this.components) {
            if (component instanceof GroupSeq) {
                component.resolveStmts();
            }
        }
    }
    
    resolve() {
        const parser = new ExprParser(this.components);
        return parser.readExpr();
    }
}


