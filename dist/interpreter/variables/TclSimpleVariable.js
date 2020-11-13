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
        define(["require", "exports", "../../parser", "./TclVariable"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TclSimpleVariable = void 0;
    var parser_1 = require("../../parser");
    var TclVariable_1 = require("./TclVariable");
    var TclSimpleVariable = (function (_super) {
        __extends(TclSimpleVariable, _super);
        function TclSimpleVariable(value) {
            var _this = _super.call(this) || this;
            _this.value = value;
            return _this;
        }
        TclSimpleVariable.prototype.setValue = function (value) {
            this.value = value;
        };
        TclSimpleVariable.prototype.getValue = function () {
            return this.value;
        };
        TclSimpleVariable.prototype.toList = function () {
            return parser_1.ParseList(this.value);
        };
        TclSimpleVariable.prototype.toString = function () {
            return "TclSimpleVariable(\"" + this.value + "\")";
        };
        TclSimpleVariable.prototype.isArray = function () {
            return false;
        };
        return TclSimpleVariable;
    }(TclVariable_1.TclVariable));
    exports.TclSimpleVariable = TclSimpleVariable;
});
//# sourceMappingURL=TclSimpleVariable.js.map