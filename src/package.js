
import * as pathUtils from "path";
import { Node } from "./node.js";

export class Package extends Node {
    
    constructor(path) {
        super();
        this.path = path;
        this.srcPath = pathUtils.join(this.path, "src");
        this.buildPath = pathUtils.join(this.path, "build");
    }
}


