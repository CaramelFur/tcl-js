const tclobj = require('./tclobject');

let stringhandlers = {
  type: 'string',
  dupJsVal(obj) {
    return obj.jsval;
  },
  updateString(obj) {
    obj.bytes = obj.jsval;
  },
  valueOf(obj) {
    return obj.jsval;
  },
  setFromAny(obj) {
    let str = obj.toString();
    obj.FreeJsVal();
    obj.jsval = str;
  },
};

function StringObj(value) {
  this.handlers = stringhandlers;
  this._init();
  this.bytes = this.jsval = String(value);
}
StringObj.prototype = new tclobj.TclObject();

tclobj.RegisterObjType('string', stringhandlers);

tclobj.NewString = function (val) {
  return new StringObj(val);
};

module.exports = StringObj;
