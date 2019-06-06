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
    exports.INUMBER = 'INUMBER';
    exports.IOP1 = 'IOP1';
    exports.IOP2 = 'IOP2';
    exports.IOP3 = 'IOP3';
    exports.IVAR = 'IVAR';
    exports.IFUNCALL = 'IFUNCALL';
    exports.IEXPR = 'IEXPR';
    exports.IMEMBER = 'IMEMBER';
    function Instruction(type, value) {
        this.type = type;
        this.value = (value !== undefined && value !== null) ? value : 0;
    }
    exports.Instruction = Instruction;
    Instruction.prototype.toString = function () {
        switch (this.type) {
            case exports.INUMBER:
            case exports.IOP1:
            case exports.IOP2:
            case exports.IOP3:
            case exports.IVAR:
                return this.value;
            case exports.IFUNCALL:
                return 'CALL ' + this.value;
            case exports.IMEMBER:
                return '.' + this.value;
            default:
                return 'Invalid Instruction';
        }
    };
    function unaryInstruction(value) {
        return new Instruction(exports.IOP1, value);
    }
    exports.unaryInstruction = unaryInstruction;
    function binaryInstruction(value) {
        return new Instruction(exports.IOP2, value);
    }
    exports.binaryInstruction = binaryInstruction;
    function ternaryInstruction(value) {
        return new Instruction(exports.IOP3, value);
    }
    exports.ternaryInstruction = ternaryInstruction;
});
//# sourceMappingURL=instruction.js.map