(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./simplify", "./substitute", "./evaluate", "./expression-to-string", "./get-symbols"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var simplify_1 = require("./simplify");
    var substitute_1 = require("./substitute");
    var evaluate_1 = require("./evaluate");
    var expression_to_string_1 = require("./expression-to-string");
    var get_symbols_1 = require("./get-symbols");
    function Expression(tokens, parser) {
        this.tokens = tokens;
        this.parser = parser;
        this.unaryOps = parser.unaryOps;
        this.binaryOps = parser.binaryOps;
        this.ternaryOps = parser.ternaryOps;
        this.functions = parser.functions;
    }
    exports.Expression = Expression;
    Expression.prototype.simplify = function (values) {
        values = values || {};
        return new Expression(simplify_1.default(this.tokens, this.unaryOps, this.binaryOps, this.ternaryOps, values), this.parser);
    };
    Expression.prototype.substitute = function (variable, expr) {
        if (!(expr instanceof Expression)) {
            expr = this.parser.parse(String(expr));
        }
        return new Expression(substitute_1.default(this.tokens, variable, expr), this.parser);
    };
    Expression.prototype.evaluate = function (values) {
        values = values || {};
        return evaluate_1.default(this.tokens, this, values);
    };
    Expression.prototype.toString = function () {
        return expression_to_string_1.default(this.tokens, false);
    };
    Expression.prototype.symbols = function (options) {
        options = options || {};
        var vars = [];
        get_symbols_1.default(this.tokens, vars, options);
        return vars;
    };
    Expression.prototype.variables = function (options) {
        options = options || {};
        var vars = [];
        get_symbols_1.default(this.tokens, vars, options);
        var functions = this.functions;
        return vars.filter(function (name) {
            return !(name in functions);
        });
    };
    Expression.prototype.toJSFunction = function (param, variables) {
        var expr = this;
        var f = new Function(param, 'with(this.functions) with (this.ternaryOps) with (this.binaryOps) with (this.unaryOps) { return ' + expression_to_string_1.default(this.simplify(variables).tokens, true) + '; }');
        return function () {
            return f.apply(expr, arguments);
        };
    };
});
//# sourceMappingURL=expression.js.map