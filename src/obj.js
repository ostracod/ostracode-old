
import { FeatureInstance } from "./factor.js";
import { ItemType } from "./itemType.js";

export class Obj {
    
    constructor(factor) {
        // Map from feature ID to FeatureInstance.
        this.featureInstances = new Map();
        for (const feature of factor.getFeatures()) {
            const featureInstance = new FeatureInstance(feature, this);
            this.featureInstances.set(feature.id, featureInstance);
        }
    }
}

export class ObjType extends ItemType {
    
    constructor(factorType) {
        super();
        this.factorType = factorType;
    }
}


