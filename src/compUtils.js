
import * as niceUtils from "./niceUtils.js";

export const resolveCompItems = (resolvables) => {
    let resolvedCount = 0;
    let unresolvedSeqs = [];
    for (const resolvable of resolvables) {
        const result = resolvable.resolveCompItems();
        resolvedCount += result.resolvedCount;
        niceUtils.extendList(unresolvedSeqs, result.unresolvedSeqs);
    }
    return { resolvedCount, unresolvedSeqs };
};

export const resolveAllCompItems = (resolvables) => {
    let lastResolvedCount = 0;
    while (true) {
        const { resolvedCount, unresolvedSeqs } = resolveCompItems(resolvables);
        if (unresolvedSeqs.length <= 0) {
            break;
        }
        if (resolvedCount <= lastResolvedCount) {
            unresolvedSeqs[0].throwError("Could not resolve expression to item.");
        }
        lastResolvedCount = resolvedCount;
    }
};


