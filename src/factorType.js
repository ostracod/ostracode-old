
import { CompilerError } from "./error.js";
import { ItemType } from "./itemType.js";
import { FeatureMemberRef } from "./itemRef.js";

export class FactorType extends ItemType {
    // Concrete subclasses of FactorType must implement these methods:
    // getDiscerner
    
    getObjMember(obj, name, evalContext) {
        const discerner = this.getDiscerner(name);
        if (discerner === null) {
            throw new CompilerError("Cannot retrieve member of feature without discerned type.");
        }
        const typeId = evalContext.getTypeId(discerner);
        const featureInstance = obj.featureInstances.get(typeId);
        return new FeatureMemberRef(featureInstance, name);
    }
}

export class FeatureType extends FactorType {
    
    constructor(itemFieldStmts, sharedFieldStmts, discerner = null) {
        super();
        this.itemFieldStmts = itemFieldStmts;
        this.sharedFieldStmts = sharedFieldStmts;
        this.discerner = discerner;
    }
    
    getDiscerner(name) {
        return this.discerner;
    }
}


