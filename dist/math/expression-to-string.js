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
    function expressionToString(tokens, toJS) {
        var nstack = [];
        var n1, n2, n3;
        var f;
        for (var i = 0; i < tokens.length; i++) {
            var item = tokens[i];
            var type = item.type;
            if (type === instruction_1.INUMBER) {
                if (typeof item.value === 'number' && item.value < 0) {
                    nstack.push('(' + item.value + ')');
                }
                else {
                    nstack.push(escapeValue(item.value));
                }
            }
            else if (type === instruction_1.IOP2) {
                n2 = nstack.pop();
                n1 = nstack.pop();
                f = item.value;
                if (toJS) {
                    if (f === '^') {
                        nstack.push('Math.pow(' + n1 + ', ' + n2 + ')');
                    }
                    else if (f === 'and') {
                        nstack.push('(!!' + n1 + ' && !!' + n2 + ')');
                    }
                    else if (f === 'or') {
                        nstack.push('(!!' + n1 + ' || !!' + n2 + ')');
                    }
                    else if (f === '||') {
                        nstack.push('(String(' + n1 + ') + String(' + n2 + '))');
                    }
                    else if (f === '==') {
                        nstack.push('(' + n1 + ' === ' + n2 + ')');
                    }
                    else if (f === '!=') {
                        nstack.push('(' + n1 + ' !== ' + n2 + ')');
                    }
                    else {
                        nstack.push('(' + n1 + ' ' + f + ' ' + n2 + ')');
                    }
                }
                else {
                    nstack.push('(' + n1 + ' ' + f + ' ' + n2 + ')');
                }
            }
            else if (type === instruction_1.IOP3) {
                n3 = nstack.pop();
                n2 = nstack.pop();
                n1 = nstack.pop();
                f = item.value;
                if (f === '?') {
                    nstack.push('(' + n1 + ' ? ' + n2 + ' : ' + n3 + ')');
                }
                else {
                    throw new Error('invalid Expression');
                }
            }
            else if (type === instruction_1.IVAR) {
                nstack.push(item.value);
            }
            else if (type === instruction_1.IOP1) {
                n1 = nstack.pop();
                f = item.value;
                if (f === '-' || f === '+') {
                    nstack.push('(' + f + n1 + ')');
                }
                else if (toJS) {
                    if (f === 'not') {
                        nstack.push('(' + '!' + n1 + ')');
                    }
                    else if (f === '!') {
                        nstack.push('fac(' + n1 + ')');
                    }
                    else {
                        nstack.push(f + '(' + n1 + ')');
                    }
                }
                else if (f === '!') {
                    nstack.push('(' + n1 + '!)');
                }
                else {
                    nstack.push('(' + f + ' ' + n1 + ')');
                }
            }
            else if (type === instruction_1.IFUNCALL) {
                var argCount = item.value;
                var args = [];
                while (argCount-- > 0) {
                    args.unshift(nstack.pop());
                }
                f = nstack.pop();
                nstack.push(f + '(' + args.join(', ') + ')');
            }
            else if (type === instruction_1.IMEMBER) {
                n1 = nstack.pop();
                nstack.push(n1 + '.' + item.value);
            }
            else if (type === instruction_1.IEXPR) {
                nstack.push('(' + expressionToString(item.value, toJS) + ')');
            }
            else {
                throw new Error('invalid Expression');
            }
        }
        if (nstack.length > 1) {
            throw new Error('invalid Expression (parity)');
        }
        return String(nstack[0]);
    }
    exports.default = expressionToString;
    function escapeValue(v) {
        if (typeof v === 'string') {
            return JSON.stringify(v).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
        }
        return v;
    }
});
//# sourceMappingURL=expression-to-string.js.map