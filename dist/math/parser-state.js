(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./token", "./instruction", "./contains"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var token_1 = require("./token");
    var instruction_1 = require("./instruction");
    var contains_1 = require("./contains");
    function ParserState(parser, tokenStream, options) {
        this.parser = parser;
        this.tokens = tokenStream;
        this.current = null;
        this.nextToken = null;
        this.next();
        this.savedCurrent = null;
        this.savedNextToken = null;
        this.allowMemberAccess = options.allowMemberAccess !== false;
    }
    exports.ParserState = ParserState;
    ParserState.prototype.next = function () {
        this.current = this.nextToken;
        this.nextToken = this.tokens.next();
        return this.nextToken;
    };
    ParserState.prototype.tokenMatches = function (token, value) {
        if (typeof value === 'undefined') {
            return true;
        }
        else if (Array.isArray(value)) {
            return contains_1.default(value, token.value);
        }
        else if (typeof value === 'function') {
            return value(token);
        }
        else {
            return token.value === value;
        }
    };
    ParserState.prototype.save = function () {
        this.savedCurrent = this.current;
        this.savedNextToken = this.nextToken;
        this.tokens.save();
    };
    ParserState.prototype.restore = function () {
        this.tokens.restore();
        this.current = this.savedCurrent;
        this.nextToken = this.savedNextToken;
    };
    ParserState.prototype.accept = function (type, value) {
        if (this.nextToken.type === type &&
            this.tokenMatches(this.nextToken, value)) {
            this.next();
            return true;
        }
        return false;
    };
    ParserState.prototype.expect = function (type, value) {
        if (!this.accept(type, value)) {
            var coords = this.tokens.getCoordinates();
            throw new Error('parse error [' +
                coords.line +
                ':' +
                coords.column +
                ']: Expected ' +
                (value || type));
        }
    };
    ParserState.prototype.parseAtom = function (instr) {
        if (this.accept(token_1.TNAME)) {
            instr.push(new instruction_1.Instruction(instruction_1.IVAR, this.current.value));
        }
        else if (this.accept(token_1.TNUMBER)) {
            instr.push(new instruction_1.Instruction(instruction_1.INUMBER, this.current.value));
        }
        else if (this.accept(token_1.TSTRING)) {
            instr.push(new instruction_1.Instruction(instruction_1.INUMBER, this.current.value));
        }
        else if (this.accept(token_1.TPAREN, '(')) {
            this.parseExpression(instr);
            this.expect(token_1.TPAREN, ')');
        }
        else {
            throw new Error('unexpected ' + this.nextToken);
        }
    };
    ParserState.prototype.parseExpression = function (instr) {
        this.parseConditionalExpression(instr);
    };
    ParserState.prototype.parseConditionalExpression = function (instr) {
        this.parseOrExpression(instr);
        while (this.accept(token_1.TOP, '?')) {
            var trueBranch = [];
            var falseBranch = [];
            this.parseConditionalExpression(trueBranch);
            this.expect(token_1.TOP, ':');
            this.parseConditionalExpression(falseBranch);
            instr.push(new instruction_1.Instruction(instruction_1.IEXPR, trueBranch));
            instr.push(new instruction_1.Instruction(instruction_1.IEXPR, falseBranch));
            instr.push(instruction_1.ternaryInstruction('?'));
        }
    };
    ParserState.prototype.parseOrExpression = function (instr) {
        this.parseAndExpression(instr);
        while (this.accept(token_1.TOP, '||')) {
            var falseBranch = [];
            this.parseAndExpression(falseBranch);
            instr.push(new instruction_1.Instruction(instruction_1.IEXPR, falseBranch));
            instr.push(instruction_1.binaryInstruction('||'));
        }
    };
    ParserState.prototype.parseAndExpression = function (instr) {
        this.parseBitwise(instr);
        while (this.accept(token_1.TOP, '&&')) {
            var trueBranch = [];
            this.parseBitwise(trueBranch);
            instr.push(new instruction_1.Instruction(instruction_1.IEXPR, trueBranch));
            instr.push(instruction_1.binaryInstruction('&&'));
        }
    };
    var BITWISE_OPERATORS = ['&', '|', '^'];
    ParserState.prototype.parseBitwise = function (instr) {
        this.parseComparison(instr);
        while (this.accept(token_1.TOP, BITWISE_OPERATORS)) {
            var op = this.current;
            this.parseComparison(instr);
            instr.push(instruction_1.binaryInstruction(op.value));
        }
    };
    var COMPARISON_OPERATORS = ['==', '!=', '<', '<=', '>=', '>', 'eq', 'ne'];
    ParserState.prototype.parseComparison = function (instr) {
        this.parseShift(instr);
        while (this.accept(token_1.TOP, COMPARISON_OPERATORS)) {
            var op = this.current;
            this.parseShift(instr);
            instr.push(instruction_1.binaryInstruction(op.value));
        }
    };
    var SHIFT_OPERATORS = ['<<', '>>'];
    ParserState.prototype.parseShift = function (instr) {
        this.parseAddSub(instr);
        while (this.accept(token_1.TOP, SHIFT_OPERATORS)) {
            var op = this.current;
            this.parseAddSub(instr);
            instr.push(instruction_1.binaryInstruction(op.value));
        }
    };
    var ADD_SUB_OPERATORS = ['+', '-'];
    ParserState.prototype.parseAddSub = function (instr) {
        this.parseTerm(instr);
        while (this.accept(token_1.TOP, ADD_SUB_OPERATORS)) {
            var op = this.current;
            this.parseTerm(instr);
            instr.push(instruction_1.binaryInstruction(op.value));
        }
    };
    var TERM_OPERATORS = ['*', '/', '%'];
    ParserState.prototype.parseTerm = function (instr) {
        this.parseExponential(instr);
        while (this.accept(token_1.TOP, TERM_OPERATORS)) {
            var op = this.current;
            this.parseExponential(instr);
            instr.push(instruction_1.binaryInstruction(op.value));
        }
    };
    ParserState.prototype.parseExponential = function (instr) {
        this.parseFactor(instr);
        while (this.accept(token_1.TOP, '**')) {
            this.parseFactor(instr);
            instr.push(instruction_1.binaryInstruction('**'));
        }
    };
    ParserState.prototype.parseFactor = function (instr) {
        var unaryOps = this.tokens.unaryOps;
        function isPrefixOperator(token) {
            return token.value in unaryOps;
        }
        this.save();
        if (this.accept(token_1.TOP, isPrefixOperator)) {
            if (this.current.value !== '-' &&
                this.current.value !== '+' &&
                this.nextToken.type === token_1.TPAREN &&
                this.nextToken.value === '(') {
                this.restore();
                this.parseFunctionCall(instr);
            }
            else {
                var op = this.current;
                this.parseFactor(instr);
                instr.push(instruction_1.unaryInstruction(op.value));
            }
        }
        else {
            this.parseFunctionCall(instr);
        }
    };
    ParserState.prototype.parseFunctionCall = function (instr) {
        var unaryOps = this.tokens.unaryOps;
        function isPrefixOperator(token) {
            return token.value in unaryOps;
        }
        if (this.accept(token_1.TOP, isPrefixOperator)) {
            var op = this.current;
            this.parseAtom(instr);
            instr.push(instruction_1.unaryInstruction(op.value));
        }
        else {
            this.parseMemberExpression(instr);
            while (this.accept(token_1.TPAREN, '(')) {
                if (this.accept(token_1.TPAREN, ')')) {
                    instr.push(new instruction_1.Instruction(instruction_1.IFUNCALL, 0));
                }
                else {
                    var argCount = this.parseArgumentList(instr);
                    instr.push(new instruction_1.Instruction(instruction_1.IFUNCALL, argCount));
                }
            }
        }
    };
    ParserState.prototype.parseArgumentList = function (instr) {
        var argCount = 0;
        while (!this.accept(token_1.TPAREN, ')')) {
            this.parseExpression(instr);
            ++argCount;
            while (this.accept(token_1.TCOMMA)) {
                this.parseExpression(instr);
                ++argCount;
            }
        }
        return argCount;
    };
    ParserState.prototype.parseMemberExpression = function (instr) {
        this.parseAtom(instr);
        while (this.accept(token_1.TOP, '.')) {
            if (!this.allowMemberAccess) {
                throw new Error('unexpected ".", member access is not permitted');
            }
            this.expect(token_1.TNAME);
            instr.push(new instruction_1.Instruction(instruction_1.IMEMBER, this.current.value));
        }
    };
});
//# sourceMappingURL=parser-state.js.map