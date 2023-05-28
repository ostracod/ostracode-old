
import { CompilerError } from "./error.js";
import { ItemType } from "./itemType.js";

export class FactorType extends ItemType {
    
    getObjMember(obj, name, evalContext) {
        throw new CompilerError("This function is not yet implemented.");
        //const featureInstance = obj.featureInstances.get(key);
        //return new FeatureMemberRef(featureInstance, name);
    }
}

export class FeatureType extends FactorType {
    
    constructor(itemFieldStmts, sharedFieldStmts) {
        super();
        this.itemFieldStmts = itemFieldStmts;
        this.sharedFieldStmts = sharedFieldStmts;
    }
    
    copyHelper() {
        return new FeatureType(this.itemFieldStmts, this.sharedFieldStmts);
    }
}


