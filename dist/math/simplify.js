(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./instruction"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var instruction_1 = require("./instruction");
    function simplify(tokens, unaryOps, binaryOps, ternaryOps, values) {
        var nstack = [];
        var newexpression = [];
        var n1, n2, n3;
        var f;
        for (var i = 0; i < tokens.length; i++) {
            var item = tokens[i];
            var type = item.type;
            if (type === instruction_1.INUMBER) {
                nstack.push(item);
            }
            else if (type === instruction_1.IVAR && values.hasOwnProperty(item.value)) {
                item = new instruction_1.Instruction(instruction_1.INUMBER, values[item.value]);
                nstack.push(item);
            }
            else if (type === instruction_1.IOP2 && nstack.length > 1) {
                n2 = nstack.pop();
                n1 = nstack.pop();
                f = binaryOps[item.value];
                item = new instruction_1.Instruction(instruction_1.INUMBER, f(n1.value, n2.value));
                nstack.push(item);
            }
            else if (type === instruction_1.IOP3 && nstack.length > 2) {
                n3 = nstack.pop();
                n2 = nstack.pop();
                n1 = nstack.pop();
                if (item.value === '?') {
                    nstack.push(n1.value ? n2.value : n3.value);
                }
                else {
                    f = ternaryOps[item.value];
                    item = new instruction_1.Instruction(instruction_1.INUMBER, f(n1.value, n2.value, n3.value));
                    nstack.push(item);
                }
            }
            else if (type === instruction_1.IOP1 && nstack.length > 0) {
                n1 = nstack.pop();
                f = unaryOps[item.value];
                item = new instruction_1.Instruction(instruction_1.INUMBER, f(n1.value));
                nstack.push(item);
            }
            else if (type === instruction_1.IEXPR) {
                while (nstack.length > 0) {
                    newexpression.push(nstack.shift());
                }
                newexpression.push(new instruction_1.Instruction(instruction_1.IEXPR, simplify(item.value, unaryOps, binaryOps, ternaryOps, values)));
            }
            else if (type === instruction_1.IMEMBER && nstack.length > 0) {
                n1 = nstack.pop();
                nstack.push(new instruction_1.Instruction(instruction_1.INUMBER, n1.value[item.value]));
            }
            else {
                while (nstack.length > 0) {
                    newexpression.push(nstack.shift());
                }
                newexpression.push(item);
            }
        }
        while (nstack.length > 0) {
            newexpression.push(nstack.shift());
        }
        return newexpression;
    }
    exports.default = simplify;
});
//# sourceMappingURL=simplify.js.map