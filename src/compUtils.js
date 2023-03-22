
import * as niceUtils from "./niceUtils.js";
import { CompilerError } from "./error.js";
import { Func } from "./func.js";

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

export const convertItemToJs = (item) => {
    if (typeof item === "string") {
        // TODO: Escape string characters.
        return `"${item}"`;
    } else if (item instanceof Func) {
        return item.convertToJs();
    } else {
        throw new CompilerError("Conversion to JS is not yet implemented for this type of item.");
    }
};


