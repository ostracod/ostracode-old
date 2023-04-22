
import { CompilerError } from "./error.js";
import * as niceUtils from "./niceUtils.js";
import { constructors } from "./constructors.js";
import { Item } from "./item.js";
import { CompContext } from "./compContext.js";

export const resolveAllCompItems = (resolvables) => {
    const exprSeqs = [];
    for (const resolvable of resolvables) {
        niceUtils.extendList(exprSeqs, resolvable.getNodesByClass(constructors.CompExprSeq));
    }
    const compContext = new CompContext(exprSeqs);
    let lastResolvedCount = 0;
    while (true) {
        const { resolvedCount, unresolvedExprs } = compContext.resolveCompItems();
        if (unresolvedExprs.length <= 0) {
            break;
        }
        if (resolvedCount <= lastResolvedCount) {
            unresolvedExprs[0].throwError("Could not resolve expression to item.");
        }
        lastResolvedCount = resolvedCount;
    }
    return compContext;
};

export const getNestedItems = (item) => {
    if (typeof item === "object") {
        if (Array.isArray(item)) {
            return item.slice();
        } else if (item instanceof Item) {
            return item.getNestedItems();
        }
    } else {
        return [];
    }
    throw new CompilerError("Cannot retrieve nested items for this type of item yet.");
};

export const getJsIdentifier = (name, prefix = "_") => (
    "$" + prefix + name.replace("$", "$$$$")
);

export const getJsCompItemIdentifier = (itemId) => getJsIdentifier(`${itemId}`, "C");

export const getJsTypeIdIdentifier = (typeId) => getJsIdentifier(`${typeId}`, "T");


