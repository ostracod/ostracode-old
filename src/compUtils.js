
import { CompilerError } from "./error.js";
import { Item } from "./item.js";

// `handle` may return `{ item: any }` or undefined. If `handle` returns `{ item: any }`,
// then the old nested item in `item` will be replaced.
export const iterateNestedItems = (item, handle) => {
    if (typeof item === "object") {
        if (Array.isArray(item)) {
            for (let index = 0; index < item.length; index++) {
                const result = handle(item[index]);
                if (typeof result !== "undefined") {
                    item[index] = result.item;
                }
            }
        } else if (item instanceof Item) {
            return item.iterateNestedItems(handle);
        } else {
            throw new CompilerError("Cannot iterate over nested items in this type of item yet.");
        }
    }
};

export const getNestedItems = (item) => {
    const output = [];
    iterateNestedItems(item, (nestedItem) => {
        output.push(nestedItem);
    });
    return output;
};

export const getJsIdentifier = (name, prefix = "_") => (
    "$" + prefix + name.replace("$", "$$$$")
);

export const getJsCompItemIdentifier = (itemId) => getJsIdentifier(`${itemId}`, "C");

export const getJsTypeIdIdentifier = (typeId) => getJsIdentifier(`${typeId}`, "T");


