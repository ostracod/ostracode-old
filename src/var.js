
import { ItemType } from "./itemType.js";

export class Var {
    
    constructor(name, statement) {
        this.name = name;
        this.statement = statement;
    }
    
    getConstraintType() {
        const { typeExprSeq, initItemExprSeq } = this.statement;
        if (typeExprSeq !== null) {
            return typeExprSeq.getCompItems()[0];
        } else if (initItemExprSeq !== null) {
            return initItemExprSeq.getConstraintTypes()[0];
        } else {
            return new ItemType();
        }
    }
    
    getParentDiscerners() {
        const { initItemExprSeq } = this.statement;
        return (initItemExprSeq === null) ? [] : initItemExprSeq.getParentDiscerners();
    }
}

export class CompVar extends Var {
    
    getCompItem() {
        return this.statement.getCompItem();
    }
}

export class EvalVar extends Var {
    
}


