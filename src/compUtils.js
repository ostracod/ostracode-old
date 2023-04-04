
import { CompilerError } from "./error.js";
import * as niceUtils from "./niceUtils.js";
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

export const getNestedItems = (item) => {
    if (typeof item === "object") {
        if (Array.isArray(item)) {
            return item.slice();
        } else if (item instanceof Func) {
            // TODO: Implement.
            return [];
        }
    } else {
        return [];
    }
    throw new CompilerError("Cannot retrieve nested items for this type of item yet.");
};

export const getJsIdentifier = (name, prefix = "_") => (
    "$" + prefix + name.replace("$", "$$$$")
);


