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
    function evaluate(tokens, expr, values) {
        var nstack = [];
        var n1, n2, n3;
        var f;
        for (var i = 0; i < tokens.length; i++) {
            var item = tokens[i];
            var type = item.type;
            if (type === instruction_1.INUMBER) {
                nstack.push(item.value);
            }
            else if (type === instruction_1.IOP2) {
                n2 = nstack.pop();
                n1 = nstack.pop();
                if (item.value === '&&') {
                    nstack.push(n1 ? !!evaluate(n2, expr, values) : false);
                }
                else if (item.value === '||') {
                    nstack.push(n1 ? true : !!evaluate(n2, expr, values));
                }
                else {
                    f = expr.binaryOps[item.value];
                    nstack.push(f(n1, n2));
                }
            }
            else if (type === instruction_1.IOP3) {
                n3 = nstack.pop();
                n2 = nstack.pop();
                n1 = nstack.pop();
                if (item.value === '?') {
                    nstack.push(evaluate(n1 ? n2 : n3, expr, values));
                }
                else {
                    f = expr.ternaryOps[item.value];
                    nstack.push(f(n1, n2, n3));
                }
            }
            else if (type === instruction_1.IVAR) {
                if (item.value in expr.functions) {
                    nstack.push(expr.functions[item.value]);
                }
                else {
                    var v = values[item.value];
                    if (v !== undefined) {
                        nstack.push(v);
                    }
                    else {
                        throw new Error('undefined variable: ' + item.value);
                    }
                }
            }
            else if (type === instruction_1.IOP1) {
                n1 = nstack.pop();
                f = expr.unaryOps[item.value];
                nstack.push(f(n1));
            }
            else if (type === instruction_1.IFUNCALL) {
                var argCount = item.value;
                var args = [];
                while (argCount-- > 0) {
                    args.unshift(nstack.pop());
                }
                f = nstack.pop();
                if (f.apply && f.call) {
                    nstack.push(f.apply(undefined, args));
                }
                else {
                    throw new Error(f + ' is not a function');
                }
            }
            else if (type === instruction_1.IEXPR) {
                nstack.push(item.value);
            }
            else if (type === instruction_1.IMEMBER) {
                n1 = nstack.pop();
                nstack.push(n1[item.value]);
            }
            else {
                throw new Error('invalid Expression');
            }
        }
        if (nstack.length > 1) {
            throw new Error('invalid Expression (parity)');
        }
        return nstack[0];
    }
    exports.default = evaluate;
});
//# sourceMappingURL=evaluate.js.map