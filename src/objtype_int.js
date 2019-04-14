const types = require('./types');
const tclobj = require('./tclobject');
const utils = require('./utils');

let inthandlers = {
  type: 'int',
  dupJsVal(obj) {
    return obj.jsval;
  },
  valueOf(obj) {
    return obj.jsval;
  },
  updateString(obj) {
    obj.bytes = String(obj.jsval);
  },
  setFromAny(obj) {
    let newjsval = utils.to_int(obj);
    obj.FreeJsVal();
    obj.jsval = newjsval;
  },
};

function IntObj(value) {
  this.handlers = inthandlers;
  this._init();
  this.jsval = utils.to_int(value);
}
IntObj.prototype = new tclobj.TclObject();

tclobj.RegisterObjType('int', inthandlers);

types.TclObjectBase.GetInt = function () {
  if (this.handlers !== inthandlers) {
    this.ConvertToType('int');
  }
  return this.jsval;
};

tclobj.NewInt = function (val) {
  return new IntObj(val);
};

types.IntOne = new IntObj(1);
types.IntZero = new IntObj(0);

module.exports = IntObj;
