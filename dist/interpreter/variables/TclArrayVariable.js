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
        define(["require", "exports", "../../TclError", "./TclVariable"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TclArrayVariable = void 0;
    var TclError_1 = require("../../TclError");
    var TclVariable_1 = require("./TclVariable");
    var TclArrayVariable = (function (_super) {
        __extends(TclArrayVariable, _super);
        function TclArrayVariable(initialValues) {
            var _this = _super.call(this) || this;
            _this.entries = {};
            _this.entries = initialValues;
            return _this;
        }
        TclArrayVariable.prototype.hasEntry = function (name) {
            return Object.keys(this.entries).indexOf(name) >= 0;
        };
        TclArrayVariable.prototype.getEntry = function (name) {
            if (!this.hasEntry(name))
                throw new TclError_1.TclError('Interpreter tried to access variable without verifying existence');
            return this.entries[name];
        };
        TclArrayVariable.prototype.setEntry = function (name, value) {
            var isNew = this.hasEntry(name);
            this.entries[name] = value;
            return isNew;
        };
        TclArrayVariable.prototype.toString = function () {
            var _this = this;
            var entries = Object.keys(this.entries)
                .map(function (entry) { return entry + ": " + _this.entries[entry].toString(); })
                .join(',\n');
            return "TclArrayVariable(\n" + entries + "\n)";
        };
        TclArrayVariable.prototype.isArray = function () {
            return true;
        };
        return TclArrayVariable;
    }(TclVariable_1.TclVariable));
    exports.TclArrayVariable = TclArrayVariable;
});
//# sourceMappingURL=TclArrayVariable.js.map