var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "expr-eval"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var expr_eval_1 = require("expr-eval");
    var Parser = (function (_super) {
        __extends(Parser, _super);
        function Parser() {
            var _this = _super.call(this, {
                operators: {
                    add: true,
                    concatenate: true,
                    conditional: true,
                    divide: true,
                    factorial: false,
                    multiply: true,
                    power: true,
                    remainder: true,
                    subtract: true,
                    logical: true,
                    comparison: true,
                    in: true,
                },
            }) || this;
            rename(_this.functions, 'random', 'rand');
            delete _this.functions.roundTo;
            delete _this.functions.factorial;
            delete _this.functions.fac;
            delete _this.functions.pyt;
            delete _this.functions.if;
            delete _this.functions.gamma;
            _this.functions = __assign({}, _this.functions, funcs);
            return _this;
        }
        return Parser;
    }(expr_eval_1.Parser));
    exports.Parser = Parser;
    var funcs = {};
    funcs.land = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return args.every(function (arg) { return arg == true; });
    };
    funcs.lor = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return args.find(function (arg) { return arg == true; }) !== undefined;
    };
    funcs.lshift = function (inp, amount) {
        return inp << amount;
    };
    funcs.rshift = function (inp, amount) {
        return inp >> amount;
    };
    funcs.band = function (a, b) {
        return a & b;
    };
    funcs.bor = function (a, b) {
        return a | b;
    };
    funcs.bnot = function (a) {
        return ~a;
    };
    funcs.bxor = function (a, b) {
        return a ^ b;
    };
    funcs.fmod = function (a, b) {
        return a % b;
    };
    funcs.bool = function (a) {
        return a ? true : false;
    };
    funcs.double = function (a) {
        return a;
    };
    funcs.entier = function (a) {
        return a;
    };
    funcs.wide = function (a) {
        return a;
    };
    funcs.int = function (a) {
        return parseInt("" + a, 10);
    };
    funcs.isqrt = function (a) {
        var out = Math.sqrt(a);
        return parseInt("" + out, 10);
    };
    funcs.srand = function (a) {
        return Math.random();
    };
    function rename(object, from, to) {
        var buf = object[from];
        delete object[from];
        object[to] = buf;
    }
});
//# sourceMappingURL=mathParser.js.map