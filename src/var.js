
export class Var {
    
    constructor(name, statement) {
        this.name = name;
        this.statement = statement;
    }
}

export class CompVar extends Var {
    
    getCompItem() {
        return this.statement.getCompItem();
    }
}

export class EvalVar extends Var {
    
}


