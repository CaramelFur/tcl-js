(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./contains"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var contains_1 = require("./contains");
    function add(a, b) {
        return Number(a) + Number(b);
    }
    exports.add = add;
    function sub(a, b) {
        return a - b;
    }
    exports.sub = sub;
    function mul(a, b) {
        return a * b;
    }
    exports.mul = mul;
    function div(a, b) {
        return a / b;
    }
    exports.div = div;
    function mod(a, b) {
        return a % b;
    }
    exports.mod = mod;
    function concat(a, b) {
        return '' + a + b;
    }
    exports.concat = concat;
    function equal(a, b) {
        return a === b;
    }
    exports.equal = equal;
    function notEqual(a, b) {
        return a !== b;
    }
    exports.notEqual = notEqual;
    function greaterThan(a, b) {
        return a > b;
    }
    exports.greaterThan = greaterThan;
    function lessThan(a, b) {
        return a < b;
    }
    exports.lessThan = lessThan;
    function greaterThanEqual(a, b) {
        return a >= b;
    }
    exports.greaterThanEqual = greaterThanEqual;
    function lessThanEqual(a, b) {
        return a <= b;
    }
    exports.lessThanEqual = lessThanEqual;
    function andOperator(a, b) {
        return Boolean(a && b);
    }
    exports.andOperator = andOperator;
    function orOperator(a, b) {
        return Boolean(a || b);
    }
    exports.orOperator = orOperator;
    function inOperator(a, b) {
        return contains_1.default(b, a);
    }
    exports.inOperator = inOperator;
    function sinh(a) {
        return (Math.exp(a) - Math.exp(-a)) / 2;
    }
    exports.sinh = sinh;
    function cosh(a) {
        return (Math.exp(a) + Math.exp(-a)) / 2;
    }
    exports.cosh = cosh;
    function tanh(a) {
        if (a === Infinity)
            return 1;
        if (a === -Infinity)
            return -1;
        return (Math.exp(a) - Math.exp(-a)) / (Math.exp(a) + Math.exp(-a));
    }
    exports.tanh = tanh;
    function asinh(a) {
        if (a === -Infinity)
            return a;
        return Math.log(a + Math.sqrt(a * a + 1));
    }
    exports.asinh = asinh;
    function acosh(a) {
        return Math.log(a + Math.sqrt(a * a - 1));
    }
    exports.acosh = acosh;
    function atanh(a) {
        return Math.log((1 + a) / (1 - a)) / 2;
    }
    exports.atanh = atanh;
    function log10(a) {
        return Math.log(a) * Math.LOG10E;
    }
    exports.log10 = log10;
    function neg(a) {
        return -a;
    }
    exports.neg = neg;
    function not(a) {
        return !a;
    }
    exports.not = not;
    function trunc(a) {
        return a < 0 ? Math.ceil(a) : Math.floor(a);
    }
    exports.trunc = trunc;
    function random(a) {
        return Math.random() * (a || 1);
    }
    exports.random = random;
    function factorial(a) {
        return gamma(a + 1);
    }
    exports.factorial = factorial;
    function bool(a) {
        if (a === 'yes' || a === 'true' || a === 'on')
            return true;
        if (a === 'no' || a === 'false' || a === 'off')
            return false;
        if (!a)
            return false;
        if (!isNaN(a) && parseInt(a, 10) > 0)
            return true;
    }
    exports.bool = bool;
    function fmod(a, b) {
        return a % b;
    }
    exports.fmod = fmod;
    ;
    function max() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        args = args.sort();
        return args[args.length - 1];
    }
    exports.max = max;
    ;
    function min() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        args = args.sort();
        return args[0];
    }
    exports.min = min;
    ;
    function isInteger(value) {
        return isFinite(value) && value === Math.round(value);
    }
    var GAMMA_G = 4.7421875;
    var GAMMA_P = [
        0.99999999999999709182,
        57.156235665862923517,
        -59.597960355475491248,
        14.136097974741747174,
        -0.49191381609762019978,
        0.33994649984811888699e-4,
        0.46523628927048575665e-4,
        -0.98374475304879564677e-4,
        0.15808870322491248884e-3,
        -0.21026444172410488319e-3,
        0.2174396181152126432e-3,
        -0.16431810653676389022e-3,
        0.84418223983852743293e-4,
        -0.2619083840158140867e-4,
        0.36899182659531622704e-5,
    ];
    function gamma(n) {
        var t, x;
        if (isInteger(n)) {
            if (n <= 0) {
                return isFinite(n) ? Infinity : NaN;
            }
            if (n > 171) {
                return Infinity;
            }
            var value = n - 2;
            var res = n - 1;
            while (value > 1) {
                res *= value;
                value--;
            }
            if (res === 0) {
                res = 1;
            }
            return res;
        }
        if (n < 0.5) {
            return Math.PI / (Math.sin(Math.PI * n) * gamma(1 - n));
        }
        if (n >= 171.35) {
            return Infinity;
        }
        if (n > 85.0) {
            var twoN = n * n;
            var threeN = twoN * n;
            var fourN = threeN * n;
            var fiveN = fourN * n;
            return (Math.sqrt((2 * Math.PI) / n) *
                Math.pow(n / Math.E, n) *
                (1 +
                    1 / (12 * n) +
                    1 / (288 * twoN) -
                    139 / (51840 * threeN) -
                    571 / (2488320 * fourN) +
                    163879 / (209018880 * fiveN) +
                    5246819 / (75246796800 * fiveN * n)));
        }
        --n;
        x = GAMMA_P[0];
        for (var i = 1; i < GAMMA_P.length; ++i) {
            x += GAMMA_P[i] / (n + i);
        }
        t = n + GAMMA_G + 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x;
    }
    exports.gamma = gamma;
    function stringLength(s) {
        return String(s).length;
    }
    exports.stringLength = stringLength;
    function hypot() {
        var sum = 0;
        var larg = 0;
        for (var i = 0; i < arguments.length; i++) {
            var arg = Math.abs(arguments[i]);
            var div;
            if (larg < arg) {
                div = larg / arg;
                sum = sum * div * div + 1;
                larg = arg;
            }
            else if (arg > 0) {
                div = arg / larg;
                sum += div * div;
            }
            else {
                sum += arg;
            }
        }
        return larg === Infinity ? Infinity : larg * Math.sqrt(sum);
    }
    exports.hypot = hypot;
    function condition(cond, yep, nope) {
        return cond ? yep : nope;
    }
    exports.condition = condition;
    function roundTo(value, exp) {
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math.round(value);
        }
        value = +value;
        exp = -+exp;
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }
        value = value.toString().split('e');
        value = Math.round(+(value[0] + 'e' + (value[1] ? +value[1] - exp : -exp)));
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? +value[1] + exp : exp));
    }
    exports.roundTo = roundTo;
});
//# sourceMappingURL=functions.js.map