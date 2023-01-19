
export class RuleInclusion {
    
    constructor(ruleName, inheritedPlatformNames = new Set()) {
        this.ruleName = ruleName;
        // Set of strings.
        this.inheritedPlatformNames = inheritedPlatformNames;
    }
}


