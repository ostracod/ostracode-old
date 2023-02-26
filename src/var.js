
import { CompilerError } from "./error.js";
import { CompVarStmt } from "./stmt.js";

export class Var {
    
    constructor(name, statement) {
        this.name = name;
        this.statement = statement;
    }
    
    getCompItem() {
        if (!(this.statement instanceof CompVarStmt)) {
            throw new CompilerError("Cannot read comptime item from evaltime variable.");
        }
        return this.statement.getCompItem();
    }
}


