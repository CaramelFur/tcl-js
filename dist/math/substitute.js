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
    function substitute(tokens, variable, expr) {
        var newexpression = [];
        for (var i = 0; i < tokens.length; i++) {
            var item = tokens[i];
            var type = item.type;
            if (type === instruction_1.IVAR && item.value === variable) {
                for (var j = 0; j < expr.tokens.length; j++) {
                    var expritem = expr.tokens[j];
                    var replitem;
                    if (expritem.type === instruction_1.IOP1) {
                        replitem = instruction_1.unaryInstruction(expritem.value);
                    }
                    else if (expritem.type === instruction_1.IOP2) {
                        replitem = instruction_1.binaryInstruction(expritem.value);
                    }
                    else if (expritem.type === instruction_1.IOP3) {
                        replitem = instruction_1.ternaryInstruction(expritem.value);
                    }
                    else {
                        replitem = new instruction_1.Instruction(expritem.type, expritem.value);
                    }
                    newexpression.push(replitem);
                }
            }
            else if (type === instruction_1.IEXPR) {
                newexpression.push(new instruction_1.Instruction(instruction_1.IEXPR, substitute(item.value, variable, expr)));
            }
            else {
                newexpression.push(item);
            }
        }
        return newexpression;
    }
    exports.default = substitute;
});
//# sourceMappingURL=substitute.js.map