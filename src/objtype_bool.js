const types = require('./types');
const tclobj = require('./tclobject');
const utils = require('./utils');

let boolhandlers = {
  type: 'bool',
  dupJsVal(obj) {
    return obj.jsval;
  },
  updateString(obj) {
    obj.bytes = obj.jsval ? '1' : '0';
  },
  valueOf(obj) {
    return obj.jsval;
  },
  setFromAny(obj) {
    let newjsval;
    if (obj.handlers.type === 'jsval') {
      switch (typeof obj.jsval) {
        case 'boolean':
          break;
        case 'number':
          obj.jsval = obj.jsval !== 0;
          break;
        case 'string':
          obj.jsval = utils.bool(obj.jsval);
          break;
        default:
          obj.jsval = utils.bool(obj.toString());
      }
      return;
    }
    if (obj.handlers.type === 'int') {
      newjsval = obj.GetInt() !== 0;
    } else {
      newjsval = utils.bool(obj.toString());
    }
    obj.FreeJsVal();
    obj.jsval = newjsval;
  },
};
let { TclObject } = types;

function any2bool(value) {
  if (value instanceof TclObject) {
    switch (value.handlers.type) {
      case 'jsval':
        value = value.jsval;
        break;
      case 'bool':
        return value.jsval;
      case 'int':
        value = value.GetInt();
        break;
      default:
        if (value.cache.bool !== undefined) {
          return value.cache.bool;
        }
        value = value.toString();
    }
  }
  switch (typeof value) {
    case 'boolean':
      return value;
    case 'number':
      return !isNaN(value) && value !== 0;
    case 'string':
      return utils.bool(value);
    default:
      throw new Error(`invalid boolean value "${value}"`);
  }
}

function BoolObj(value) {
  this.handlers = boolhandlers;
  this._init();
  this.jsval = any2bool(value);
}
BoolObj.prototype = new TclObject();

tclobj.RegisterObjType('bool', boolhandlers);

types.TclObjectBase.GetBool = function () {
  if (this.handlers !== boolhandlers) {
    if (this.cache.bool === undefined) {
      this.cache.bool = any2bool(this);
    }
    return this.cache.bool;
  }
  return this.jsval;
};

tclobj.NewBool = function (val) {
  return new BoolObj(val);
};

module.exports = BoolObj;
