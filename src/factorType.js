
import { CompilerError, UnknownItemError } from "./error.js";
import { UnknownItem } from "./item.js";
import { ItemType } from "./itemType.js";
import { FeatureMemberRef } from "./itemRef.js";

export class FactorType extends ItemType {
    // Concrete subclasses of FactorType must implement these methods:
    // getAnchor
    
    getKey(name, evalContext) {
        const anchor = this.getAnchor(name);
        if (anchor === null) {
            return null;
        } else if (anchor instanceof UnknownItem) {
            throw new UnknownItemError(anchor);
        } else {
            return evalContext.derefAnchor(anchor).read();
        }
    }
    
    getObjMember(obj, name, evalContext) {
        const key = this.getKey(name, evalContext);
        if (key === null) {
            throw new CompilerError("Cannot access field of feature with missing key.");
        }
        const featureInstance = obj.featureInstances.get(key);
        return new FeatureMemberRef(featureInstance, name);
    }
}

export class FeatureType extends FactorType {
    
    constructor(featureExpr, anchor = null) {
        super();
        this.featureExpr = featureExpr;
        this.anchor = anchor;
    }
    
    copyHelper() {
        return new FeatureType(this.featureExpr, this.anchor);
    }
    
    getAnchor(name) {
        return this.anchor;
    }
}


