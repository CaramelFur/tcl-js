var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parse = exports.SyntaxError = void 0;
    var SyntaxError = (function (_super) {
        __extends(SyntaxError, _super);
        function SyntaxError(message, expected, found, location) {
            var _this = _super.call(this) || this;
            _this.message = message;
            _this.expected = expected;
            _this.found = found;
            _this.location = location;
            _this.name = "SyntaxError";
            if (typeof Error.captureStackTrace === "function") {
                Error.captureStackTrace(_this, SyntaxError);
            }
            return _this;
        }
        SyntaxError.buildMessage = function (expected, found) {
            function hex(ch) {
                return ch.charCodeAt(0).toString(16).toUpperCase();
            }
            function literalEscape(s) {
                return s
                    .replace(/\\/g, "\\\\")
                    .replace(/"/g, "\\\"")
                    .replace(/\0/g, "\\0")
                    .replace(/\t/g, "\\t")
                    .replace(/\n/g, "\\n")
                    .replace(/\r/g, "\\r")
                    .replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
                    .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
            }
            function classEscape(s) {
                return s
                    .replace(/\\/g, "\\\\")
                    .replace(/\]/g, "\\]")
                    .replace(/\^/g, "\\^")
                    .replace(/-/g, "\\-")
                    .replace(/\0/g, "\\0")
                    .replace(/\t/g, "\\t")
                    .replace(/\n/g, "\\n")
                    .replace(/\r/g, "\\r")
                    .replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
                    .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
            }
            function describeExpectation(expectation) {
                switch (expectation.type) {
                    case "literal":
                        return "\"" + literalEscape(expectation.text) + "\"";
                    case "class":
                        var escapedParts = expectation.parts.map(function (part) {
                            return Array.isArray(part)
                                ? classEscape(part[0]) + "-" + classEscape(part[1])
                                : classEscape(part);
                        });
                        return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
                    case "any":
                        return "any character";
                    case "end":
                        return "end of input";
                    case "other":
                        return expectation.description;
                }
            }
            function describeExpected(expected1) {
                var descriptions = expected1.map(describeExpectation);
                var i;
                var j;
                descriptions.sort();
                if (descriptions.length > 0) {
                    for (i = 1, j = 1; i < descriptions.length; i++) {
                        if (descriptions[i - 1] !== descriptions[i]) {
                            descriptions[j] = descriptions[i];
                            j++;
                        }
                    }
                    descriptions.length = j;
                }
                switch (descriptions.length) {
                    case 1:
                        return descriptions[0];
                    case 2:
                        return descriptions[0] + " or " + descriptions[1];
                    default:
                        return descriptions.slice(0, -1).join(", ")
                            + ", or "
                            + descriptions[descriptions.length - 1];
                }
            }
            function describeFound(found1) {
                return found1 ? "\"" + literalEscape(found1) + "\"" : "end of input";
            }
            return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
        };
        return SyntaxError;
    }(Error));
    exports.SyntaxError = SyntaxError;
    function peg$parse(input, options) {
        options = options !== undefined ? options : {};
        var peg$FAILED = {};
        var peg$startRuleFunctions = { singleword: peg$parsesingleword };
        var peg$startRuleFunction = peg$parsesingleword;
        var peg$c0 = function (chars) { return new TextPart(chars.join('')); };
        var peg$c1 = peg$anyExpectation();
        var peg$c2 = function (char) { return char; };
        var peg$c3 = function (chars) {
            return new VariablePart(chars.join(''));
        };
        var peg$c4 = function (name, subname) { return new VariablePart(name.join(''), subname); };
        var peg$c5 = function (c) { return c; };
        var peg$c6 = function (name) {
            return new VariablePart(name.join(''));
        };
        var peg$c7 = function (variable) { return variable; };
        var peg$c8 = /^[a-zA-Z0-9_]/;
        var peg$c9 = peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "_"], false, false);
        var peg$c10 = function (part) { return new CodePart(part.slice(1, -1)); };
        var peg$c11 = function (contents) { return '[' + contents.join('') + ']'; };
        var peg$c12 = function (e) { return e; };
        var peg$c13 = function (char) {
            return new EscapePart(char);
        };
        var peg$c14 = function (one, two, three) {
            return new EscapePart((one || '') + (two || '') + three, EscapePartType.octal);
        };
        var peg$c15 = function (high, low) {
            return new EscapePart(high ? high + low : low, EscapePartType.hex);
        };
        var peg$c16 = function (one, two, three, four) {
            return new EscapePart((one || '') + (two || '') + (three || '') + four, EscapePartType.hex16);
        };
        var peg$c17 = function (one, two, three, four, five, six, seven, eight) {
            return new EscapePart((one || '') +
                (two || '') +
                (three || '') +
                (four || '') +
                (five || '') +
                (six || '') +
                (seven || '') +
                eight, EscapePartType.hex32);
        };
        var peg$c18 = "x";
        var peg$c19 = peg$literalExpectation("x", false);
        var peg$c20 = "u";
        var peg$c21 = peg$literalExpectation("u", false);
        var peg$c22 = "U";
        var peg$c23 = peg$literalExpectation("U", false);
        var peg$c24 = "\\";
        var peg$c25 = peg$literalExpectation("\\", false);
        var peg$c26 = "#";
        var peg$c27 = peg$literalExpectation("#", false);
        var peg$c28 = "$";
        var peg$c29 = peg$literalExpectation("$", false);
        var peg$c30 = "\"";
        var peg$c31 = peg$literalExpectation("\"", false);
        var peg$c32 = "{";
        var peg$c33 = peg$literalExpectation("{", false);
        var peg$c34 = "}";
        var peg$c35 = peg$literalExpectation("}", false);
        var peg$c36 = "[";
        var peg$c37 = peg$literalExpectation("[", false);
        var peg$c38 = "]";
        var peg$c39 = peg$literalExpectation("]", false);
        var peg$c40 = "(";
        var peg$c41 = peg$literalExpectation("(", false);
        var peg$c42 = ")";
        var peg$c43 = peg$literalExpectation(")", false);
        var peg$c44 = "{*}";
        var peg$c45 = peg$literalExpectation("{*}", false);
        var peg$c46 = "::";
        var peg$c47 = peg$literalExpectation("::", false);
        var peg$c48 = ";";
        var peg$c49 = peg$literalExpectation(";", false);
        var peg$c50 = /^[ \t\x0B\f\r]/;
        var peg$c51 = peg$classExpectation([" ", "\t", "\x0B", "\f", "\r"], false, false);
        var peg$c52 = "\n";
        var peg$c53 = peg$literalExpectation("\n", false);
        var peg$c54 = /^[0-7]/;
        var peg$c55 = peg$classExpectation([["0", "7"]], false, false);
        var peg$c56 = /^[0-9]/;
        var peg$c57 = peg$classExpectation([["0", "9"]], false, false);
        var peg$c58 = /^[0-9A-Fa-f]/;
        var peg$c59 = peg$classExpectation([["0", "9"], ["A", "F"], ["a", "f"]], false, false);
        var peg$c60 = function (c) { return '\\' + c; };
        var peg$currPos = 0;
        var peg$savedPos = 0;
        var peg$posDetailsCache = [{ line: 1, column: 1 }];
        var peg$maxFailPos = 0;
        var peg$maxFailExpected = [];
        var peg$silentFails = 0;
        var peg$result;
        if (options.startRule !== undefined) {
            if (!(options.startRule in peg$startRuleFunctions)) {
                throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
            }
            peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
        }
        function text() {
            return input.substring(peg$savedPos, peg$currPos);
        }
        function location() {
            return peg$computeLocation(peg$savedPos, peg$currPos);
        }
        function expected(description, location1) {
            location1 = location1 !== undefined
                ? location1
                : peg$computeLocation(peg$savedPos, peg$currPos);
            throw peg$buildStructuredError([peg$otherExpectation(description)], input.substring(peg$savedPos, peg$currPos), location1);
        }
        function error(message, location1) {
            location1 = location1 !== undefined
                ? location1
                : peg$computeLocation(peg$savedPos, peg$currPos);
            throw peg$buildSimpleError(message, location1);
        }
        function peg$literalExpectation(text1, ignoreCase) {
            return { type: "literal", text: text1, ignoreCase: ignoreCase };
        }
        function peg$classExpectation(parts, inverted, ignoreCase) {
            return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
        }
        function peg$anyExpectation() {
            return { type: "any" };
        }
        function peg$endExpectation() {
            return { type: "end" };
        }
        function peg$otherExpectation(description) {
            return { type: "other", description: description };
        }
        function peg$computePosDetails(pos) {
            var details = peg$posDetailsCache[pos];
            var p;
            if (details) {
                return details;
            }
            else {
                p = pos - 1;
                while (!peg$posDetailsCache[p]) {
                    p--;
                }
                details = peg$posDetailsCache[p];
                details = {
                    line: details.line,
                    column: details.column
                };
                while (p < pos) {
                    if (input.charCodeAt(p) === 10) {
                        details.line++;
                        details.column = 1;
                    }
                    else {
                        details.column++;
                    }
                    p++;
                }
                peg$posDetailsCache[pos] = details;
                return details;
            }
        }
        function peg$computeLocation(startPos, endPos) {
            var startPosDetails = peg$computePosDetails(startPos);
            var endPosDetails = peg$computePosDetails(endPos);
            return {
                start: {
                    offset: startPos,
                    line: startPosDetails.line,
                    column: startPosDetails.column
                },
                end: {
                    offset: endPos,
                    line: endPosDetails.line,
                    column: endPosDetails.column
                }
            };
        }
        function peg$fail(expected1) {
            if (peg$currPos < peg$maxFailPos) {
                return;
            }
            if (peg$currPos > peg$maxFailPos) {
                peg$maxFailPos = peg$currPos;
                peg$maxFailExpected = [];
            }
            peg$maxFailExpected.push(expected1);
        }
        function peg$buildSimpleError(message, location1) {
            return new SyntaxError(message, [], "", location1);
        }
        function peg$buildStructuredError(expected1, found, location1) {
            return new SyntaxError(SyntaxError.buildMessage(expected1, found), expected1, found, location1);
        }
        function peg$parsesingleword() {
            var s0, s1;
            s0 = [];
            s1 = peg$parsepart();
            if (s1 !== peg$FAILED) {
                while (s1 !== peg$FAILED) {
                    s0.push(s1);
                    s1 = peg$parsepart();
                }
            }
            else {
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsepart() {
            var s0;
            s0 = peg$parsetextPart();
            if (s0 === peg$FAILED) {
                s0 = peg$parseescapePart();
                if (s0 === peg$FAILED) {
                    s0 = peg$parsevariablePart();
                    if (s0 === peg$FAILED) {
                        s0 = peg$parsecodePart();
                    }
                }
            }
            return s0;
        }
        function peg$parsetextPart() {
            var s0, s1, s2;
            s0 = peg$currPos;
            s1 = [];
            s2 = peg$parsetextPartChar();
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    s2 = peg$parsetextPartChar();
                }
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c0(s1);
            }
            s0 = s1;
            return s0;
        }
        function peg$parsetextPartChar() {
            var s0, s1, s2, s3, s4;
            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            s2 = peg$parseescape();
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = undefined;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$currPos;
                peg$silentFails++;
                s3 = peg$parsedollarSign();
                peg$silentFails--;
                if (s3 === peg$FAILED) {
                    s2 = undefined;
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$currPos;
                    peg$silentFails++;
                    s4 = peg$parsebracketOpen();
                    peg$silentFails--;
                    if (s4 === peg$FAILED) {
                        s3 = undefined;
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                    if (s3 !== peg$FAILED) {
                        if (input.length > peg$currPos) {
                            s4 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s4 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c1);
                            }
                        }
                        if (s4 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c2(s4);
                            s0 = s1;
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsevariablePart() {
            var s0, s1, s2, s3, s4, s5, s6, s7;
            s0 = peg$currPos;
            s1 = peg$parsedollarSign();
            if (s1 !== peg$FAILED) {
                s2 = peg$currPos;
                s3 = [];
                s4 = peg$parsevariableChar();
                if (s4 !== peg$FAILED) {
                    while (s4 !== peg$FAILED) {
                        s3.push(s4);
                        s4 = peg$parsevariableChar();
                    }
                }
                else {
                    s3 = peg$FAILED;
                }
                if (s3 !== peg$FAILED) {
                    s4 = peg$currPos;
                    peg$silentFails++;
                    s5 = peg$parseparenthesisOpen();
                    peg$silentFails--;
                    if (s5 === peg$FAILED) {
                        s4 = undefined;
                    }
                    else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                    if (s4 !== peg$FAILED) {
                        peg$savedPos = s2;
                        s3 = peg$c3(s3);
                        s2 = s3;
                    }
                    else {
                        peg$currPos = s2;
                        s2 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
                if (s2 === peg$FAILED) {
                    s2 = peg$currPos;
                    s3 = [];
                    s4 = peg$parsevariableChar();
                    while (s4 !== peg$FAILED) {
                        s3.push(s4);
                        s4 = peg$parsevariableChar();
                    }
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parseparenthesisOpen();
                        if (s4 !== peg$FAILED) {
                            s5 = [];
                            s6 = peg$parsevariableIndexPart();
                            if (s6 !== peg$FAILED) {
                                while (s6 !== peg$FAILED) {
                                    s5.push(s6);
                                    s6 = peg$parsevariableIndexPart();
                                }
                            }
                            else {
                                s5 = peg$FAILED;
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parseparenthesisClose();
                                if (s6 !== peg$FAILED) {
                                    peg$savedPos = s2;
                                    s3 = peg$c4(s3, s5);
                                    s2 = s3;
                                }
                                else {
                                    peg$currPos = s2;
                                    s2 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s2;
                                s2 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s2;
                            s2 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s2;
                        s2 = peg$FAILED;
                    }
                    if (s2 === peg$FAILED) {
                        s2 = peg$currPos;
                        s3 = peg$parsebraceOpen();
                        if (s3 !== peg$FAILED) {
                            s4 = [];
                            s5 = peg$currPos;
                            s6 = peg$currPos;
                            peg$silentFails++;
                            s7 = peg$parsebraceClose();
                            peg$silentFails--;
                            if (s7 === peg$FAILED) {
                                s6 = undefined;
                            }
                            else {
                                peg$currPos = s6;
                                s6 = peg$FAILED;
                            }
                            if (s6 !== peg$FAILED) {
                                s7 = peg$parseany();
                                if (s7 !== peg$FAILED) {
                                    peg$savedPos = s5;
                                    s6 = peg$c5(s7);
                                    s5 = s6;
                                }
                                else {
                                    peg$currPos = s5;
                                    s5 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s5;
                                s5 = peg$FAILED;
                            }
                            while (s5 !== peg$FAILED) {
                                s4.push(s5);
                                s5 = peg$currPos;
                                s6 = peg$currPos;
                                peg$silentFails++;
                                s7 = peg$parsebraceClose();
                                peg$silentFails--;
                                if (s7 === peg$FAILED) {
                                    s6 = undefined;
                                }
                                else {
                                    peg$currPos = s6;
                                    s6 = peg$FAILED;
                                }
                                if (s6 !== peg$FAILED) {
                                    s7 = peg$parseany();
                                    if (s7 !== peg$FAILED) {
                                        peg$savedPos = s5;
                                        s6 = peg$c5(s7);
                                        s5 = s6;
                                    }
                                    else {
                                        peg$currPos = s5;
                                        s5 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s5;
                                    s5 = peg$FAILED;
                                }
                            }
                            if (s4 !== peg$FAILED) {
                                s5 = peg$parsebraceClose();
                                if (s5 !== peg$FAILED) {
                                    peg$savedPos = s2;
                                    s3 = peg$c6(s4);
                                    s2 = s3;
                                }
                                else {
                                    peg$currPos = s2;
                                    s2 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s2;
                                s2 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s2;
                            s2 = peg$FAILED;
                        }
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c7(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsevariableIndexPart() {
            var s0;
            s0 = peg$parsevariableIndexTextPart();
            if (s0 === peg$FAILED) {
                s0 = peg$parseescapePart();
                if (s0 === peg$FAILED) {
                    s0 = peg$parsevariablePart();
                    if (s0 === peg$FAILED) {
                        s0 = peg$parsecodePart();
                    }
                }
            }
            return s0;
        }
        function peg$parsevariableIndexTextPart() {
            var s0, s1, s2;
            s0 = peg$currPos;
            s1 = [];
            s2 = peg$parsevariableIndexTextPartChar();
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    s2 = peg$parsevariableIndexTextPartChar();
                }
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c0(s1);
            }
            s0 = s1;
            return s0;
        }
        function peg$parsevariableIndexTextPartChar() {
            var s0, s1, s2, s3, s4, s5;
            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            s2 = peg$parseescape();
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = undefined;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$currPos;
                peg$silentFails++;
                s3 = peg$parsedollarSign();
                peg$silentFails--;
                if (s3 === peg$FAILED) {
                    s2 = undefined;
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$currPos;
                    peg$silentFails++;
                    s4 = peg$parsebracketOpen();
                    peg$silentFails--;
                    if (s4 === peg$FAILED) {
                        s3 = undefined;
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                    if (s3 !== peg$FAILED) {
                        s4 = peg$currPos;
                        peg$silentFails++;
                        s5 = peg$parseparenthesisClose();
                        peg$silentFails--;
                        if (s5 === peg$FAILED) {
                            s4 = undefined;
                        }
                        else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                        if (s4 !== peg$FAILED) {
                            if (input.length > peg$currPos) {
                                s5 = input.charAt(peg$currPos);
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c1);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c2(s5);
                                s0 = s1;
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsevariableChar() {
            var s0;
            if (peg$c8.test(input.charAt(peg$currPos))) {
                s0 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c9);
                }
            }
            if (s0 === peg$FAILED) {
                s0 = peg$parsenamespaceSeparator();
            }
            return s0;
        }
        function peg$parsecodePart() {
            var s0, s1;
            s0 = peg$currPos;
            s1 = peg$parserawCodePart();
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c10(s1);
            }
            s0 = s1;
            return s0;
        }
        function peg$parserawCodePart() {
            var s0, s1, s2, s3, s4, s5, s6;
            s0 = peg$currPos;
            s1 = peg$parsebracketOpen();
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$currPos;
                s4 = peg$currPos;
                peg$silentFails++;
                s5 = peg$parsebracketOpen();
                peg$silentFails--;
                if (s5 === peg$FAILED) {
                    s4 = undefined;
                }
                else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                }
                if (s4 !== peg$FAILED) {
                    s5 = peg$currPos;
                    peg$silentFails++;
                    s6 = peg$parsebracketClose();
                    peg$silentFails--;
                    if (s6 === peg$FAILED) {
                        s5 = undefined;
                    }
                    else {
                        peg$currPos = s5;
                        s5 = peg$FAILED;
                    }
                    if (s5 !== peg$FAILED) {
                        s6 = peg$parseany();
                        if (s6 !== peg$FAILED) {
                            peg$savedPos = s3;
                            s4 = peg$c5(s6);
                            s3 = s4;
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
                if (s3 === peg$FAILED) {
                    s3 = peg$parserawCodePart();
                }
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$currPos;
                    s4 = peg$currPos;
                    peg$silentFails++;
                    s5 = peg$parsebracketOpen();
                    peg$silentFails--;
                    if (s5 === peg$FAILED) {
                        s4 = undefined;
                    }
                    else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                    if (s4 !== peg$FAILED) {
                        s5 = peg$currPos;
                        peg$silentFails++;
                        s6 = peg$parsebracketClose();
                        peg$silentFails--;
                        if (s6 === peg$FAILED) {
                            s5 = undefined;
                        }
                        else {
                            peg$currPos = s5;
                            s5 = peg$FAILED;
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parseany();
                            if (s6 !== peg$FAILED) {
                                peg$savedPos = s3;
                                s4 = peg$c5(s6);
                                s3 = s4;
                            }
                            else {
                                peg$currPos = s3;
                                s3 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                    if (s3 === peg$FAILED) {
                        s3 = peg$parserawCodePart();
                    }
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$parsebracketClose();
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c11(s2);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseescapePart() {
            var s0, s1, s2;
            s0 = peg$currPos;
            s1 = peg$parseescape();
            if (s1 !== peg$FAILED) {
                s2 = peg$parsenormalEscape();
                if (s2 === peg$FAILED) {
                    s2 = peg$parseoctalEscape();
                    if (s2 === peg$FAILED) {
                        s2 = peg$parsehexEscape();
                        if (s2 === peg$FAILED) {
                            s2 = peg$parseunicodeEscape();
                            if (s2 === peg$FAILED) {
                                s2 = peg$parselargeUnicodeEscape();
                            }
                        }
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c12(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsenormalEscape() {
            var s0, s1, s2, s3, s4, s5;
            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            s2 = peg$parseoctalChar();
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = undefined;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$currPos;
                peg$silentFails++;
                s3 = peg$parseeightBitHex();
                peg$silentFails--;
                if (s3 === peg$FAILED) {
                    s2 = undefined;
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$currPos;
                    peg$silentFails++;
                    s4 = peg$parsesixteenBitHex();
                    peg$silentFails--;
                    if (s4 === peg$FAILED) {
                        s3 = undefined;
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                    if (s3 !== peg$FAILED) {
                        s4 = peg$currPos;
                        peg$silentFails++;
                        s5 = peg$parsethirtytwoBitHex();
                        peg$silentFails--;
                        if (s5 === peg$FAILED) {
                            s4 = undefined;
                        }
                        else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                        if (s4 !== peg$FAILED) {
                            if (input.length > peg$currPos) {
                                s5 = input.charAt(peg$currPos);
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c1);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c13(s5);
                                s0 = s1;
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseoctalEscape() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            s1 = peg$parseoctalChar();
            if (s1 === peg$FAILED) {
                s1 = null;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parseoctalChar();
                if (s2 === peg$FAILED) {
                    s2 = null;
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseoctalChar();
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c14(s1, s2, s3);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsehexEscape() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            s1 = peg$parseeightBitHex();
            if (s1 !== peg$FAILED) {
                s2 = peg$parsehexChar();
                if (s2 === peg$FAILED) {
                    s2 = null;
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$parsehexChar();
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c15(s2, s3);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseunicodeEscape() {
            var s0, s1, s2, s3, s4, s5;
            s0 = peg$currPos;
            s1 = peg$parsesixteenBitHex();
            if (s1 !== peg$FAILED) {
                s2 = peg$parsehexChar();
                if (s2 === peg$FAILED) {
                    s2 = null;
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$parsehexChar();
                    if (s3 === peg$FAILED) {
                        s3 = null;
                    }
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parsehexChar();
                        if (s4 === peg$FAILED) {
                            s4 = null;
                        }
                        if (s4 !== peg$FAILED) {
                            s5 = peg$parsehexChar();
                            if (s5 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c16(s2, s3, s4, s5);
                                s0 = s1;
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parselargeUnicodeEscape() {
            var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
            s0 = peg$currPos;
            s1 = peg$parsethirtytwoBitHex();
            if (s1 !== peg$FAILED) {
                s2 = peg$parsehexChar();
                if (s2 === peg$FAILED) {
                    s2 = null;
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$parsehexChar();
                    if (s3 === peg$FAILED) {
                        s3 = null;
                    }
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parsehexChar();
                        if (s4 === peg$FAILED) {
                            s4 = null;
                        }
                        if (s4 !== peg$FAILED) {
                            s5 = peg$parsehexChar();
                            if (s5 === peg$FAILED) {
                                s5 = null;
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parsehexChar();
                                if (s6 === peg$FAILED) {
                                    s6 = null;
                                }
                                if (s6 !== peg$FAILED) {
                                    s7 = peg$parsehexChar();
                                    if (s7 === peg$FAILED) {
                                        s7 = null;
                                    }
                                    if (s7 !== peg$FAILED) {
                                        s8 = peg$parsehexChar();
                                        if (s8 === peg$FAILED) {
                                            s8 = null;
                                        }
                                        if (s8 !== peg$FAILED) {
                                            s9 = peg$parsehexChar();
                                            if (s9 !== peg$FAILED) {
                                                peg$savedPos = s0;
                                                s1 = peg$c17(s2, s3, s4, s5, s6, s7, s8, s9);
                                                s0 = s1;
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseeightBitHex() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 120) {
                s0 = peg$c18;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c19);
                }
            }
            return s0;
        }
        function peg$parsesixteenBitHex() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 117) {
                s0 = peg$c20;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c21);
                }
            }
            return s0;
        }
        function peg$parsethirtytwoBitHex() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 85) {
                s0 = peg$c22;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c23);
                }
            }
            return s0;
        }
        function peg$parseescape() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 92) {
                s0 = peg$c24;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c25);
                }
            }
            return s0;
        }
        function peg$parsepound() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 35) {
                s0 = peg$c26;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c27);
                }
            }
            return s0;
        }
        function peg$parsedollarSign() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 36) {
                s0 = peg$c28;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c29);
                }
            }
            return s0;
        }
        function peg$parsequote() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 34) {
                s0 = peg$c30;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c31);
                }
            }
            return s0;
        }
        function peg$parsebraceOpen() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 123) {
                s0 = peg$c32;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c33);
                }
            }
            return s0;
        }
        function peg$parsebraceClose() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 125) {
                s0 = peg$c34;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c35);
                }
            }
            return s0;
        }
        function peg$parsebracketOpen() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 91) {
                s0 = peg$c36;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c37);
                }
            }
            return s0;
        }
        function peg$parsebracketClose() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 93) {
                s0 = peg$c38;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c39);
                }
            }
            return s0;
        }
        function peg$parseparenthesisOpen() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 40) {
                s0 = peg$c40;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c41);
                }
            }
            return s0;
        }
        function peg$parseparenthesisClose() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 41) {
                s0 = peg$c42;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c43);
                }
            }
            return s0;
        }
        function peg$parseexpansionSymbol() {
            var s0;
            if (input.substr(peg$currPos, 3) === peg$c44) {
                s0 = peg$c44;
                peg$currPos += 3;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c45);
                }
            }
            return s0;
        }
        function peg$parsenamespaceSeparator() {
            var s0;
            if (input.substr(peg$currPos, 2) === peg$c46) {
                s0 = peg$c46;
                peg$currPos += 2;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c47);
                }
            }
            return s0;
        }
        function peg$parsesemicolon() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 59) {
                s0 = peg$c48;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c49);
                }
            }
            return s0;
        }
        function peg$parsecommandSeperator() {
            var s0, s1;
            s0 = [];
            s1 = peg$parsenewLineChar();
            if (s1 === peg$FAILED) {
                s1 = peg$parsesemicolon();
            }
            if (s1 !== peg$FAILED) {
                while (s1 !== peg$FAILED) {
                    s0.push(s1);
                    s1 = peg$parsenewLineChar();
                    if (s1 === peg$FAILED) {
                        s1 = peg$parsesemicolon();
                    }
                }
            }
            else {
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parse_() {
            var s0, s1;
            s0 = [];
            s1 = peg$parsewhiteSpaceChar();
            while (s1 !== peg$FAILED) {
                s0.push(s1);
                s1 = peg$parsewhiteSpaceChar();
            }
            return s0;
        }
        function peg$parse__() {
            var s0, s1;
            s0 = [];
            s1 = peg$parsewhiteSpaceChar();
            if (s1 !== peg$FAILED) {
                while (s1 !== peg$FAILED) {
                    s0.push(s1);
                    s1 = peg$parsewhiteSpaceChar();
                }
            }
            else {
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsewhiteSpaceChar() {
            var s0;
            if (peg$c50.test(input.charAt(peg$currPos))) {
                s0 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c51);
                }
            }
            return s0;
        }
        function peg$parsenonWhiteSpaceChar() {
            var s0, s1, s2;
            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            s2 = peg$parsewhiteSpaceChar();
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = undefined;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parseany();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c5(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsenewLineChar() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 10) {
                s0 = peg$c52;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c53);
                }
            }
            return s0;
        }
        function peg$parsenonNewLineChar() {
            var s0, s1, s2;
            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            s2 = peg$parsenewLineChar();
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = undefined;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parseany();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c5(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseoctalChar() {
            var s0;
            if (peg$c54.test(input.charAt(peg$currPos))) {
                s0 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c55);
                }
            }
            return s0;
        }
        function peg$parsedecimalChar() {
            var s0;
            if (peg$c56.test(input.charAt(peg$currPos))) {
                s0 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c57);
                }
            }
            return s0;
        }
        function peg$parsehexChar() {
            var s0;
            if (peg$c58.test(input.charAt(peg$currPos))) {
                s0 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c59);
                }
            }
            return s0;
        }
        function peg$parseany() {
            var s0, s1, s2;
            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            s2 = peg$parseescape();
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = undefined;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                if (input.length > peg$currPos) {
                    s2 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c1);
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c5(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parseescape();
                if (s1 !== peg$FAILED) {
                    if (input.length > peg$currPos) {
                        s2 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s2 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c1);
                        }
                    }
                    if (s2 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c60(s2);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            return s0;
        }
        var _a = require('../../parser/WordToken.ts'), EscapePartType = _a.EscapePartType, AnyWordPart = _a.AnyWordPart, TextPart = _a.TextPart, EscapePart = _a.EscapePart, CodePart = _a.CodePart, VariablePart = _a.VariablePart;
        peg$result = peg$startRuleFunction();
        if (peg$result !== peg$FAILED && peg$currPos === input.length) {
            return peg$result;
        }
        else {
            if (peg$result !== peg$FAILED && peg$currPos < input.length) {
                peg$fail(peg$endExpectation());
            }
            throw peg$buildStructuredError(peg$maxFailExpected, peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null, peg$maxFailPos < input.length
                ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
                : peg$computeLocation(peg$maxFailPos, peg$maxFailPos));
        }
    }
    exports.parse = peg$parse;
});
//# sourceMappingURL=word.js.map