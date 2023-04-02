
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
        }
    } else {
        return [];
    }
    throw new CompilerError("Cannot retrieve nested items for this type of item yet.");
};

// `convertNestedItem` is a function which accepts two arguments:
// > The nested item within `item`
// > A function which accepts an identifier, and returns JS code
//   which references the nested item
export const convertItemToJs = (item, convertNestedItem) => {
    const type = typeof item;
    if (type === "string") {
        // TODO: Escape string characters.
        return `"${item}"`;
    } else if (type === "number" || type === "boolean" || type === "null"
            || type === "undefined") {
        return `${item}`;
    } else if (type === "object") {
        if (Array.isArray(item)) {
            const codeList = item.map((element, index) => convertNestedItem(
                element,
                (identifier) => `${identifier}[${index}]`,
            ));
            return `[${codeList.join(", ")}]`;
        } else if (item instanceof Func) {
            return item.convertToJs(convertNestedItem);
        }
    }
    throw new CompilerError("Conversion to JS is not yet implemented for this type of item.");
};

export const getJsIdentifier = (name, prefix = "_") => (
    "$" + prefix + name.replace("$", "$$$$")
);


