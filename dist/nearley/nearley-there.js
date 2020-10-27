(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "fs", "nearley"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.compile = void 0;
    var fs = require("fs");
    var Nearley = require("nearley");
    var Compile = require('nearley/lib/compile.js');
    var Generate = require('nearley/lib/generate.js');
    var nearleyGrammar = require('nearley/lib/nearley-language-bootstrapped.js');
    var resolvePath = function (text) {
        try {
            if (fs.statSync(text).isFile())
                return fs.readFileSync(text, 'utf8');
            return text;
        }
        catch (e) {
            return text;
        }
    };
    var compileGrammar = function (grammar, location) {
        var parsed = new Nearley.Parser(nearleyGrammar).feed(grammar).results[0];
        var compiled = Compile(parsed, { args: [location] });
        var generated = Generate(compiled);
        var cleaned = generated
            .split('\n')
            .filter(function (line) { return line !== 'export default grammar;'; })
            .map(function (line) {
            if (line === '// @ts-ignore')
                return ('/* eslint-disable @typescript-eslint/no-unused-vars */\n' +
                    '/* eslint-disable @typescript-eslint/no-explicit-any */\n' +
                    '/* eslint-disable @typescript-eslint/ban-types */\n' +
                    '/* eslint-disable no-var */');
            if (line === 'interface NearleyToken {  value: any;')
                return ('interface NearleyToken {\n' +
                    'value: any;\n' +
                    'offset: number;\n' +
                    'text: string;\n' +
                    'lineBreaks: number;\n' +
                    'line: number;\n' +
                    'col: number;\n');
            if (line === '  formatError: (token: NearleyToken) => string;')
                return '  formatError: (token: NearleyToken, message?: string | undefined) => string;';
            return line;
        })
            .join('\n');
        return "\nimport * as Nearley from 'nearley';\n\n/** Generated by Nearley.js **/\n" + cleaned + "\n/** End **/\n\nconst CompiledParser = new (Nearley.Parser as any)(grammar).grammar;\n";
    };
    exports.compile = function (grammar, location, destination) {
        var uncompiledGrammar = '@preprocessor typescript\n' + resolvePath(grammar);
        var compiledGrammar = compileGrammar(uncompiledGrammar, location);
        var result = "\n" + compiledGrammar + "\nconst parse = (input: string): any => (new Nearley.Parser(CompiledParser)).feed(input).results[0];\nexport default parse;\n";
        if (destination)
            fs.writeFileSync(destination, result);
        return result;
    };
});
//# sourceMappingURL=nearley-there.js.map