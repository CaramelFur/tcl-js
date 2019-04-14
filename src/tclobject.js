let iface;
let objtypes = {};
let TclObjectBase;
let jsvalhandlers;
let NewObj;
let pendingFree = [];
let freeTimeout;

jsvalhandlers = {
  type: 'jsval',
  freeJsVal(obj) {
    obj.jsval = null;
  },
  dupJsVal(obj) {
    return obj.jsval;
  },
  updateString(obj) {
    obj.bytes = obj.jsval.toString();
  },
  updateJsVal() {},
  setFromAny(obj) {
    obj.updateJsVal();
    obj.InvalidateCaches();
    obj.handlers = jsvalhandlers;
  },
};

function freeObjs() {
  let obj;
  freeTimeout = null;
  while (pendingFree.length > 0) {
    obj = pendingFree.pop();
    if (obj.refCount <= 0) {
      obj.FreeJsVal();
    }
  }
}

TclObjectBase = {
  _init() {
    this.refCount = 0;
    this.bytes = null;
    this.cache = {};
  },

  IncrRefCount() {
    this.refCount += 1;
  },
  DecrRefCount() {
    if (--this.refCount <= 0) {
      pendingFree.push(this);
      if (freeTimeout == null) {
        freeTimeout = setTimeout(freeObjs, 0);
      }
    }
  },
  FreeJsVal() {
    if (this.handlers.freeJsVal) {
      this.handlers.freeJsVal(this);
    }
  },
  toString() {
    if (this.bytes == null) {
      this.handlers.updateString(this);
    }
    return this.bytes;
  },
  GetString() {
    return this.toString();
  },
  DuplicateObj() {
    let obj;
    if (this.jsval == null) {
      this.handlers.updateJsVal(this);
    }
    obj = new TclObject();
    obj.handlers = this.handlers;
    obj.jsval = this.handlers.dupJsVal(this);
    return obj;
  },
  IsShared() {
    return this.refCount > 1;
  },
  valueOf() {
    if (this.jsval == null) {
      this.handlers.updateJsVal(this);
    }
    return this.jsval;
  },
  GetJsVal() {
    return this.valueOf();
  },
  ConvertToType(type) {
    if (this.handlers.type === type) {
      return;
    }
    objtypes[type].setFromAny(this);
    this.handlers = objtypes[type];
    // this.InvalidateCaches();
  },
  InvalidateCaches() {
    this.bytes = null;
    this.cache = {};
  },
  replace(old) {
    if (old != null && old.DecrRefCount !== undefined) {
      old.DecrRefCount();
    }
    this.IncrRefCount();
    return this;
  },
};

function RegisterObjType(type, handlers) {
  if (objtypes[type] !== undefined) {
    throw new Error(`ObjType "${type}" already registered`);
  }
  objtypes[type] = handlers;
}

function TclObject() {
  // Do not put anything in here, it will be shared by all instances
}
TclObject.prototype = TclObjectBase;

NewObj = function (type, value) {
  let obj;
  if (type === undefined) {
    type = 'auto';
  }
  if (type === 'auto') {
    if (value == null) {
      // Not so happy about this - it will hide a lot of bugs
      value = '';
      type = 'jsval';
    } else if (value instanceof Array) {
      type = 'list';
    } else if (typeof value === 'object') {
      if (value instanceof Date) {
        // TODO: possibly build a date objtype, that preserves the js Date
        // instance in its jsval?  (With smart toString and setFromAny)
        type = 'jsval';
        value = value.toUTCString();
      } else {
        type = 'dict';
      }
    } else {
      type = 'jsval';
    }
  }
  if (objtypes[type] === undefined) {
    throw new Error(`ObjType not registered: "${type}"`);
  }
  obj = new TclObject();
  obj.handlers = jsvalhandlers;
  obj._init();
  obj.jsval = value;
  obj.ConvertToType(type);
  return obj;
};

RegisterObjType('jsval', jsvalhandlers);

iface = {
  TclObject,
  TclObjectBase,
  RegisterObjType,
  NewObj,
  AsObj(value) {
    return value instanceof TclObject ? value : NewObj('auto', value);
  },
  AsVal(value) {
    return value instanceof TclObject ? value.valueOf() : value;
  },
};

module.exports = iface;
