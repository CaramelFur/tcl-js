import { InstructionTypes, Instruction } from './instruction';
import { Expression } from './expression';
import { Value } from './parser';

export default function evaluate(
  tokens: Instruction[],
  expr: Expression,
  values: Value,
) {
  let nstack: Array<number | boolean | string | Instruction[]> = [];
  let n1, n2, n3;
  let f;
  for (let i = 0; i < tokens.length; i++) {
    let item = tokens[i];
    let type = item.type;
    if (type === InstructionTypes.INUMBER) {
      nstack.push(item.value);
    } else if (type === InstructionTypes.IOP2) {
      n2 = nstack.pop();
      n1 = nstack.pop();
      if (!n2) throw new Error('undefined stack');
      if (item.value === '&&') {
        nstack.push(n1 ? !!evaluate(n2, expr, values) : false);
      } else if (item.value === '||') {
        nstack.push(n1 ? true : !!evaluate(n2, expr, values));
      } else {
        f = expr.binaryOps[item.value.toString()];
        nstack.push(f(n1, n2));
      }
    } else if (type === InstructionTypes.IOP3) {
      n3 = nstack.pop();
      n2 = nstack.pop();
      n1 = nstack.pop();
      if (!n2 || !n3) throw new Error('undefined stack');
      if (item.value === '?') {
        nstack.push(evaluate(n1 ? n2 : n3, expr, values));
      } else {
        f = expr.ternaryOps[item.value];
        nstack.push(f(n1, n2, n3));
      }
    } else if (type === InstructionTypes.IVAR) {
      if (item.value in expr.functions) {
        nstack.push(expr.functions[item.value]);
      } else {
        let v = values[item.value];
        if (v !== undefined) {
          nstack.push(v);
        } else {
          throw new Error('undefined variable: ' + item.value);
        }
      }
    } else if (type === InstructionTypes.IOP1) {
      n1 = nstack.pop();
      f = expr.unaryOps[item.value];
      nstack.push(f(n1));
    } else if (type === InstructionTypes.IFUNCALL) {
      let argCount = item.value;
      let args = [];
      while (argCount-- > 0) {
        args.unshift(nstack.pop());
      }
      f = nstack.pop();
      if (f.apply && f.call) {
        nstack.push(f.apply(undefined, args));
      } else {
        throw new Error(f + ' is not a function');
      }
    } else if (type === InstructionTypes.IEXPR) {
      nstack.push(item.value);
    } else if (type === InstructionTypes.IMEMBER) {
      n1 = nstack.pop();
      nstack.push(n1[item.value]);
    } else {
      throw new Error('invalid Expression');
    }
  }
  if (nstack.length > 1) {
    throw new Error('invalid Expression (parity)');
  }
  return nstack[0];
}
