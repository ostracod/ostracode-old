
import * as niceUtils from "./niceUtils.js";

export const resolveCompItems = (resolvables) => {
    let resolvedCount = 0;
    let unresolvedExprs = [];
    for (const resolvable of resolvables) {
        const result = resolvable.resolveCompItems();
        resolvedCount += result.resolvedCount;
        niceUtils.extendList(unresolvedExprs, result.unresolvedExprs);
    }
    return { resolvedCount, unresolvedExprs };
};

export const resolveAllCompItems = (resolvables) => {
    let lastResolvedCount = 0;
    while (true) {
        const { resolvedCount, unresolvedExprs } = resolveCompItems(resolvables);
        if (unresolvedExprs.length <= 0) {
            break;
        }
        if (resolvedCount <= lastResolvedCount) {
            unresolvedExprs[0].throwError("Could not resolve expression to item.");
        }
        lastResolvedCount = resolvedCount;
    }
};


