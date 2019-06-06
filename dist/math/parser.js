(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./token", "./token-stream", "./parser-state", "./expression", "./functions"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var token_1 = require("./token");
    var token_stream_1 = require("./token-stream");
    var parser_state_1 = require("./parser-state");
    var expression_1 = require("./expression");
    var functions_1 = require("./functions");
    function Parser(options) {
        this.options = options || {};
        this.unaryOps = {
            '!': function (a) { return !a; },
            '~': function (a) { return ~a; },
            '+': Number,
            '-': functions_1.neg,
        };
        this.binaryOps = {
            '+': function (a, b) { return a + b; },
            '-': function (a, b) { return a - b; },
            '*': function (a, b) { return a * b; },
            '/': function (a, b) { return a / b; },
            '%': function (a, b) { return a % b; },
            '**': Math.pow,
            '||': function (a, b) { return a || b; },
            '&&': function (a, b) { return a && b; },
            '==': function (a, b) { return a == b; },
            '!=': function (a, b) { return a != b; },
            '>': function (a, b) { return a > b; },
            '<': function (a, b) { return a < b; },
            '>=': function (a, b) { return a >= b; },
            '<=': function (a, b) { return a <= b; },
            '<<': function (a, b) { return a << b; },
            '>>': function (a, b) { return a >> b; },
            '&': function (a, b) { return a & b; },
            '^': function (a, b) { return a ^ b; },
            '|': function (a, b) { return a | b; },
        };
        this.ternaryOps = {
            '?': functions_1.condition,
        };
        this.functions = {
            abs: Math.abs,
            acos: Math.acos,
            asin: Math.asin,
            atan: Math.atan,
            atan2: Math.atan2,
            bool: functions_1.bool,
            ceil: Math.ceil,
            cos: Math.cos,
            cosh: Math.cosh || functions_1.cosh,
            double: function (a) { return a; },
            entier: function (a) { return a; },
            exp: Math.exp,
            floor: Math.floor,
            fmod: functions_1.fmod,
            hypot: Math.hypot,
            int: function (a) { return Math.round(a); },
            isqrt: function (a) { return Math.floor(Math.sqrt(a)); },
            log10: Math.log10 || functions_1.log10,
            log: Math.log,
            max: Math.max,
            min: Math.min,
            pow: Math.pow,
            rand: function () { return Math.random(); },
            round: Math.round,
            sin: Math.sin,
            sinh: Math.sinh || functions_1.sinh,
            sqrt: Math.sqrt,
            srand: function (a) { return Math.random(); },
            tan: Math.tan,
            tanh: Math.tanh || functions_1.tanh,
            wide: function (a) { return a; },
        };
        this.consts = {
            E: Math.E,
            PI: Math.PI,
            true: true,
            yes: true,
            on: true,
            false: false,
            no: false,
            off: false
        };
    }
    exports.Parser = Parser;
    Parser.prototype.parse = function (expr) {
        var instr = [];
        var parserState = new parser_state_1.ParserState(this, new token_stream_1.TokenStream(this, expr), {
            allowMemberAccess: this.options.allowMemberAccess,
        });
        parserState.parseExpression(instr);
        parserState.expect(token_1.TEOF, 'EOF');
        return new expression_1.Expression(instr, this);
    };
    Parser.prototype.evaluate = function (expr, variables) {
        return this.parse(expr).evaluate(variables);
    };
    var sharedParser = new Parser();
    Parser.parse = function (expr) {
        return sharedParser.parse(expr);
    };
    Parser.evaluate = function (expr, variables) {
        return sharedParser.parse(expr).evaluate(variables);
    };
});
//# sourceMappingURL=parser.js.map