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
        var peg$startRuleFunctions = { script: peg$parsescript };
        var peg$startRuleFunction = peg$parsescript;
        var peg$c0 = function (list) { return list ? list : new TclScript([]); };
        var peg$c1 = function (firstcommand, otherstatements) {
            return otherstatements.prepend(firstcommand);
        };
        var peg$c2 = function (firstcommand) { return new TclScript([firstcommand]); };
        var peg$c3 = function (cmnt, otherstatements) {
            return otherstatements.prepend(cmnt);
        };
        var peg$c4 = function (cmnt) { return new TclScript([cmnt]); };
        var peg$c5 = function (chars) { return new TclComment(chars.join('')); };
        var peg$c6 = function (words) { return words; };
        var peg$c7 = function (firstword, otherwords) {
            return otherwords.prepend(firstword);
        };
        var peg$c8 = function (firstword) { return new TclCommand([firstword]); };
        var peg$c9 = function (parts) {
            return new TclWord(parts.join(''));
        };
        var peg$c10 = function (char) {
            return char;
        };
        var peg$c11 = function (chars) { return chars.join(''); };
        var peg$c12 = function (parts) { return new TclWord(parts.join('')); };
        var peg$c13 = function (char) { return char; };
        var peg$c14 = function (chars) {
            return chars.join('');
        };
        var peg$c15 = function (chars) {
            return new TclWord([new TclWordPart(chars.slice(1, -1))], TclWordTypes.brace);
        };
        var peg$c16 = function (open, c) { return c; };
        var peg$c17 = function (open, contents, close) { return open + contents.join('') + close; };
        var peg$c18 = function (w) { return w.setExpand(true); };
        var peg$c19 = function (part) { return part; };
        var peg$c20 = function (c) { return c; };
        var peg$c21 = function (contents) { return '[' + contents.join('') + ']'; };
        var peg$c22 = function (chars) { return '$' + chars.join(''); };
        var peg$c23 = function (name, subname) { return '$' + name + '(' + subname + ')'; };
        var peg$c24 = function (name) {
            return '$' + '{' + name.join('') + '}';
        };
        var peg$c25 = function (vname) { return vname; };
        var peg$c26 = /^[a-zA-Z0-9_]/;
        var peg$c27 = peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "_"], false, false);
        var peg$c28 = "\\";
        var peg$c29 = peg$literalExpectation("\\", false);
        var peg$c30 = "#";
        var peg$c31 = peg$literalExpectation("#", false);
        var peg$c32 = "$";
        var peg$c33 = peg$literalExpectation("$", false);
        var peg$c34 = "\"";
        var peg$c35 = peg$literalExpectation("\"", false);
        var peg$c36 = "{";
        var peg$c37 = peg$literalExpectation("{", false);
        var peg$c38 = "}";
        var peg$c39 = peg$literalExpectation("}", false);
        var peg$c40 = "[";
        var peg$c41 = peg$literalExpectation("[", false);
        var peg$c42 = "]";
        var peg$c43 = peg$literalExpectation("]", false);
        var peg$c44 = "(";
        var peg$c45 = peg$literalExpectation("(", false);
        var peg$c46 = ")";
        var peg$c47 = peg$literalExpectation(")", false);
        var peg$c48 = "{*}";
        var peg$c49 = peg$literalExpectation("{*}", false);
        var peg$c50 = "::";
        var peg$c51 = peg$literalExpectation("::", false);
        var peg$c52 = ";";
        var peg$c53 = peg$literalExpectation(";", false);
        var peg$c54 = /^[ \t]/;
        var peg$c55 = peg$classExpectation([" ", "\t"], false, false);
        var peg$c56 = /^[\n\r]/;
        var peg$c57 = peg$classExpectation(["\n", "\r"], false, false);
        var peg$c58 = peg$anyExpectation();
        var peg$c59 = function (c) { return '\\' + c; };
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
        function peg$parsescript() {
            var s0, s1;
            s0 = peg$currPos;
            s1 = peg$parsestatementlist();
            if (s1 === peg$FAILED) {
                s1 = null;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c0(s1);
            }
            s0 = s1;
            return s0;
        }
        function peg$parsestatementlist() {
            var s0;
            s0 = peg$parsecommandlist();
            if (s0 === peg$FAILED) {
                s0 = peg$parsecommentlist();
            }
            return s0;
        }
        function peg$parsecommandlist() {
            var s0, s1, s2, s3, s4, s5;
            s0 = peg$currPos;
            s1 = peg$parsecommand();
            if (s1 === peg$FAILED) {
                s1 = null;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parsecommandSeperator();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            s5 = peg$parsestatementlist();
                            if (s5 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c1(s1, s5);
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
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parsecommand();
                if (s1 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c2(s1);
                }
                s0 = s1;
            }
            return s0;
        }
        function peg$parsecommentlist() {
            var s0, s1, s2, s3, s4;
            s0 = peg$currPos;
            s1 = peg$parsecomment();
            if (s1 !== peg$FAILED) {
                s2 = peg$parsenewLineChar();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parse_();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parsestatementlist();
                        if (s4 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c3(s1, s4);
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
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parsecomment();
                if (s1 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c4(s1);
                }
                s0 = s1;
            }
            return s0;
        }
        function peg$parsecomment() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            s1 = peg$parsepound();
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$parsenonNewLineChar();
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$parsenonNewLineChar();
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
            return s0;
        }
        function peg$parsecommand() {
            var s0, s1, s2;
            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            s2 = peg$parsepound();
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = undefined;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parsecommandwords();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c6(s2);
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
        function peg$parsecommandwords() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            s1 = peg$parseword();
            if (s1 !== peg$FAILED) {
                s2 = peg$parse__();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parsecommandwords();
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c7(s1, s3);
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
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parseword();
                if (s1 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c8(s1);
                }
                s0 = s1;
            }
            return s0;
        }
        function peg$parseword() {
            var s0;
            s0 = peg$parsesimpleWord();
            if (s0 === peg$FAILED) {
                s0 = peg$parsequotedWord();
                if (s0 === peg$FAILED) {
                    s0 = peg$parsebracedWord();
                    if (s0 === peg$FAILED) {
                        s0 = peg$parseexpansionWord();
                    }
                }
            }
            return s0;
        }
        function peg$parsesimpleWord() {
            var s0, s1, s2, s3, s4;
            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            s2 = peg$parsequote();
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
                s3 = peg$parsebraceOpen();
                peg$silentFails--;
                if (s3 === peg$FAILED) {
                    s2 = undefined;
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
                if (s2 !== peg$FAILED) {
                    s3 = [];
                    s4 = peg$parsesimpleWordPart();
                    if (s4 !== peg$FAILED) {
                        while (s4 !== peg$FAILED) {
                            s3.push(s4);
                            s4 = peg$parsesimpleWordPart();
                        }
                    }
                    else {
                        s3 = peg$FAILED;
                    }
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c9(s3);
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
        function peg$parsesimpleWordPart() {
            var s0, s1, s2, s3, s4, s5, s6, s7;
            s0 = peg$currPos;
            s1 = [];
            s2 = peg$currPos;
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
                s5 = peg$parsedollarSign();
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
                    s6 = peg$parsewhiteSpaceChar();
                    peg$silentFails--;
                    if (s6 === peg$FAILED) {
                        s5 = undefined;
                    }
                    else {
                        peg$currPos = s5;
                        s5 = peg$FAILED;
                    }
                    if (s5 !== peg$FAILED) {
                        s6 = peg$currPos;
                        peg$silentFails++;
                        s7 = peg$parsecommandSeperator();
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
                                peg$savedPos = s2;
                                s3 = peg$c10(s7);
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
            }
            else {
                peg$currPos = s2;
                s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    s2 = peg$currPos;
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
                        s5 = peg$parsedollarSign();
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
                            s6 = peg$parsewhiteSpaceChar();
                            peg$silentFails--;
                            if (s6 === peg$FAILED) {
                                s5 = undefined;
                            }
                            else {
                                peg$currPos = s5;
                                s5 = peg$FAILED;
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$currPos;
                                peg$silentFails++;
                                s7 = peg$parsecommandSeperator();
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
                                        peg$savedPos = s2;
                                        s3 = peg$c10(s7);
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
                    }
                    else {
                        peg$currPos = s2;
                        s2 = peg$FAILED;
                    }
                }
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c11(s1);
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
                s0 = peg$parsebracketWordPart();
                if (s0 === peg$FAILED) {
                    s0 = peg$parsevariableWordPart();
                }
            }
            return s0;
        }
        function peg$parsequotedWord() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            s1 = peg$parsequote();
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$parsequotedWordPart();
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$parsequotedWordPart();
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$parsequote();
                    if (s3 !== peg$FAILED) {
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
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsequotedWordPart() {
            var s0, s1, s2, s3, s4, s5, s6;
            s0 = peg$currPos;
            s1 = [];
            s2 = peg$currPos;
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
                s5 = peg$parsedollarSign();
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
                    s6 = peg$parsequote();
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
                            peg$savedPos = s2;
                            s3 = peg$c13(s6);
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
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    s2 = peg$currPos;
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
                        s5 = peg$parsedollarSign();
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
                            s6 = peg$parsequote();
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
                                    peg$savedPos = s2;
                                    s3 = peg$c13(s6);
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
                }
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c14(s1);
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
                s0 = peg$parsebracketWordPart();
                if (s0 === peg$FAILED) {
                    s0 = peg$parsevariableWordPart();
                }
            }
            return s0;
        }
        function peg$parsebracedWord() {
            var s0, s1, s2;
            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            s2 = peg$parseexpansionSymbol();
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = undefined;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parserawBracedWord();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c15(s2);
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
        function peg$parserawBracedWord() {
            var s0, s1, s2, s3, s4, s5, s6;
            s0 = peg$currPos;
            s1 = peg$parsebraceOpen();
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$currPos;
                s4 = peg$currPos;
                peg$silentFails++;
                s5 = peg$parsebraceOpen();
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
                    s6 = peg$parsebraceClose();
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
                            s4 = peg$c16(s1, s6);
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
                    s3 = peg$parserawBracedWord();
                }
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$currPos;
                    s4 = peg$currPos;
                    peg$silentFails++;
                    s5 = peg$parsebraceOpen();
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
                        s6 = peg$parsebraceClose();
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
                                s4 = peg$c16(s1, s6);
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
                        s3 = peg$parserawBracedWord();
                    }
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$parsebraceClose();
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c17(s1, s2, s3);
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
        function peg$parseexpansionWord() {
            var s0, s1, s2;
            s0 = peg$currPos;
            s1 = peg$parseexpansionSymbol();
            if (s1 !== peg$FAILED) {
                s2 = peg$parseword();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c18(s2);
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
        function peg$parsebracketWordPart() {
            var s0, s1;
            s0 = peg$currPos;
            s1 = peg$parserawBracketWordPart();
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c19(s1);
            }
            s0 = s1;
            return s0;
        }
        function peg$parserawBracketWordPart() {
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
                            s4 = peg$c20(s6);
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
                    s3 = peg$parserawBracketWordPart();
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
                                s4 = peg$c20(s6);
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
                        s3 = peg$parserawBracketWordPart();
                    }
                }
                if (s2 !== peg$FAILED) {
                    s3 = peg$parsebracketClose();
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c21(s2);
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
        function peg$parsevariableWordPart() {
            var s0, s1, s2, s3, s4, s5, s6, s7, s8;
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
                    peg$savedPos = s2;
                    s3 = peg$c22(s3);
                }
                s2 = s3;
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
                            s6 = peg$currPos;
                            s7 = peg$currPos;
                            peg$silentFails++;
                            s8 = peg$parseparenthesisClose();
                            peg$silentFails--;
                            if (s8 === peg$FAILED) {
                                s7 = undefined;
                            }
                            else {
                                peg$currPos = s7;
                                s7 = peg$FAILED;
                            }
                            if (s7 !== peg$FAILED) {
                                s8 = peg$parseany();
                                if (s8 !== peg$FAILED) {
                                    s7 = [s7, s8];
                                    s6 = s7;
                                }
                                else {
                                    peg$currPos = s6;
                                    s6 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s6;
                                s6 = peg$FAILED;
                            }
                            while (s6 !== peg$FAILED) {
                                s5.push(s6);
                                s6 = peg$currPos;
                                s7 = peg$currPos;
                                peg$silentFails++;
                                s8 = peg$parseparenthesisClose();
                                peg$silentFails--;
                                if (s8 === peg$FAILED) {
                                    s7 = undefined;
                                }
                                else {
                                    peg$currPos = s7;
                                    s7 = peg$FAILED;
                                }
                                if (s7 !== peg$FAILED) {
                                    s8 = peg$parseany();
                                    if (s8 !== peg$FAILED) {
                                        s7 = [s7, s8];
                                        s6 = s7;
                                    }
                                    else {
                                        peg$currPos = s6;
                                        s6 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s6;
                                    s6 = peg$FAILED;
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parseparenthesisClose();
                                if (s6 !== peg$FAILED) {
                                    peg$savedPos = s2;
                                    s3 = peg$c23(s3, s5);
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
                                    s6 = [s6, s7];
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
                                        s6 = [s6, s7];
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
                                    s3 = peg$c24(s4);
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
                    s1 = peg$c25(s2);
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
        function peg$parsevariableChar() {
            var s0;
            if (peg$c26.test(input.charAt(peg$currPos))) {
                s0 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c27);
                }
            }
            if (s0 === peg$FAILED) {
                s0 = peg$parsenamespaceSeparator();
            }
            return s0;
        }
        function peg$parseescape() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 92) {
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
        function peg$parsepound() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 35) {
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
        function peg$parsedollarSign() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 36) {
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
        function peg$parsequote() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 34) {
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
        function peg$parsebraceOpen() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 123) {
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
        function peg$parsebraceClose() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 125) {
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
        function peg$parsebracketOpen() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 91) {
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
        function peg$parsebracketClose() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 93) {
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
        function peg$parseparenthesisOpen() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 40) {
                s0 = peg$c44;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c45);
                }
            }
            return s0;
        }
        function peg$parseparenthesisClose() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 41) {
                s0 = peg$c46;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c47);
                }
            }
            return s0;
        }
        function peg$parseexpansionSymbol() {
            var s0;
            if (input.substr(peg$currPos, 3) === peg$c48) {
                s0 = peg$c48;
                peg$currPos += 3;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c49);
                }
            }
            return s0;
        }
        function peg$parsenamespaceSeparator() {
            var s0;
            if (input.substr(peg$currPos, 2) === peg$c50) {
                s0 = peg$c50;
                peg$currPos += 2;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c51);
                }
            }
            return s0;
        }
        function peg$parsesemicolon() {
            var s0;
            if (input.charCodeAt(peg$currPos) === 59) {
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
                    s1 = peg$c20(s2);
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
                    s1 = peg$c20(s2);
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
                        peg$fail(peg$c58);
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c20(s2);
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
                            peg$fail(peg$c58);
                        }
                    }
                    if (s2 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c59(s2);
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
        var _a = require('../TclToken.ts'), TclWordPartTypes = _a.TclWordPartTypes, TclWordTypes = _a.TclWordTypes, TclScript = _a.TclScript, TclCommand = _a.TclCommand, TclComment = _a.TclComment, TclWord = _a.TclWord, TclWordPart = _a.TclWordPart, TclVariable = _a.TclVariable;
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
//# sourceMappingURL=parser.js.map