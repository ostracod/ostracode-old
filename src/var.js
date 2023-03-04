
import { CompilerError } from "./error.js";
import { CompVarStmt } from "./stmt.js";

export class Var {
    // Concrete subclasses of Var must implement these methods:
    // getItem
    
    constructor(name, statement) {
        this.name = name;
        this.statement = statement;
    }
}

export class CompVar extends Var {
    
    getItem() {
        return this.statement.getCompItem();
    }
}

export class EvalVar extends Var {
    
    getItem() {
        throw new CompilerError("Reading evaltime variable is not yet implemented.");
    }
}


