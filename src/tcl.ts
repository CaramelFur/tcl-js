import { readFileSync } from "fs";
import * as util from "util";
import { parse } from "./parser/";

const tclFile = readFileSync("test/test.tcl", "utf-8");

let parsed = parse(tclFile);

console.log(util.inspect(parsed, false, Infinity, true));
const e = () => {
    console.log("hello");
};
//
