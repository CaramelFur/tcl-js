import contains from './contains';

export function add(a: any, b: any) {
  return Number(a) + Number(b);
}

export function sub(a: any, b: any) {
  return a - b;
}

export function mul(a: any, b: any) {
  return a * b;
}

export function div(a: any, b: any) {
  return a / b;
}

export function mod(a: any, b: any) {
  return a % b;
}

export function concat(a: any, b: any) {
  return '' + a + b;
}

export function equal(a: any, b: any) {
  return a === b;
}

export function notEqual(a: any, b: any) {
  return a !== b;
}

export function greaterThan(a: any, b: any) {
  return a > b;
}

export function lessThan(a: any, b: any) {
  return a < b;
}

export function greaterThanEqual(a: any, b: any) {
  return a >= b;
}

export function lessThanEqual(a: any, b: any) {
  return a <= b;
}

export function andOperator(a: any, b: any) {
  return Boolean(a && b);
}

export function orOperator(a: any, b: any) {
  return Boolean(a || b);
}

export function inOperator(a: any, b: any) {
  return contains(b, a);
}

export function sinh(a: any) {
  return (Math.exp(a) - Math.exp(-a)) / 2;
}

export function cosh(a: any) {
  return (Math.exp(a) + Math.exp(-a)) / 2;
}

export function tanh(a: any) {
  if (a === Infinity) return 1;
  if (a === -Infinity) return -1;
  return (Math.exp(a) - Math.exp(-a)) / (Math.exp(a) + Math.exp(-a));
}

export function asinh(a: any) {
  if (a === -Infinity) return a;
  return Math.log(a + Math.sqrt(a * a + 1));
}

export function acosh(a: any) {
  return Math.log(a + Math.sqrt(a * a - 1));
}

export function atanh(a: any) {
  return Math.log((1 + a) / (1 - a)) / 2;
}

export function log10(a: any) {
  return Math.log(a) * Math.LOG10E;
}

export function neg(a: any) {
  return -a;
}

export function not(a: any) {
  return !a;
}

export function trunc(a: any) {
  return a < 0 ? Math.ceil(a) : Math.floor(a);
}

export function random(a: any) {
  return Math.random() * (a || 1);
}

export function factorial(a: any) {
  // a!
  return gamma(a + 1);
}

export function bool(a: any) {
  if (a === 'yes' || a === 'true' || a === 'on') return true;
  if (a === 'no' || a === 'false' || a === 'off') return false;
  if (!a) return false;
  if (!isNaN(a) && parseInt(a, 10) > 0) return true;
  return false;
}

export function fmod(a: any, b: any) {
  return a % b;
}

export function max(...args: any[]) {
  args = args.sort();
  return args[args.length - 1];
}

export function min(...args: any[]) {
  args = args.sort();
  return args[0];
}

function isInteger(value: any) {
  return isFinite(value) && value === Math.round(value);
}

let GAMMA_G = 4.7421875;
let GAMMA_P = [
  0.99999999999999709182,
  57.156235665862923517,
  -59.597960355475491248,
  14.136097974741747174,
  -0.49191381609762019978,
  0.33994649984811888699e-4,
  0.46523628927048575665e-4,
  -0.98374475304879564677e-4,
  0.15808870322491248884e-3,
  -0.21026444172410488319e-3,
  0.2174396181152126432e-3,
  -0.16431810653676389022e-3,
  0.84418223983852743293e-4,
  -0.2619083840158140867e-4,
  0.36899182659531622704e-5,
];

// Gamma function from math.js
export function gamma(n: any): any {
  let t, x;

  if (isInteger(n)) {
    if (n <= 0) {
      return isFinite(n) ? Infinity : NaN;
    }

    if (n > 171) {
      return Infinity; // Will overflow
    }

    let value = n - 2;
    let res = n - 1;
    while (value > 1) {
      res *= value;
      value--;
    }

    if (res === 0) {
      res = 1; // 0! is per definition 1
    }

    return res;
  }

  if (n < 0.5) {
    return Math.PI / (Math.sin(Math.PI * n) * gamma(1 - n));
  }

  if (n >= 171.35) {
    return Infinity; // will overflow
  }

  if (n > 85.0) {
    // Extended Stirling Approx
    let twoN = n * n;
    let threeN = twoN * n;
    let fourN = threeN * n;
    let fiveN = fourN * n;
    return (
      Math.sqrt((2 * Math.PI) / n) *
      Math.pow(n / Math.E, n) *
      (1 +
        1 / (12 * n) +
        1 / (288 * twoN) -
        139 / (51840 * threeN) -
        571 / (2488320 * fourN) +
        163879 / (209018880 * fiveN) +
        5246819 / (75246796800 * fiveN * n))
    );
  }

  --n;
  x = GAMMA_P[0];
  for (let i = 1; i < GAMMA_P.length; ++i) {
    x += GAMMA_P[i] / (n + i);
  }

  t = n + GAMMA_G + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x;
}

export function stringLength(s: any) {
  return String(s).length;
}

export function hypot() {
  let sum = 0;
  let larg = 0;
  for (let i = 0; i < arguments.length; i++) {
    let arg = Math.abs(arguments[i]);
    let div;
    if (larg < arg) {
      div = larg / arg;
      sum = sum * div * div + 1;
      larg = arg;
    } else if (arg > 0) {
      div = arg / larg;
      sum += div * div;
    } else {
      sum += arg;
    }
  }
  return larg === Infinity ? Infinity : larg * Math.sqrt(sum);
}

export function condition(cond: any, yep: any, nope: any) {
  return cond ? yep : nope;
}

/**
 * Decimal adjustment of a number.
 * From @escopecz.
 *
 * @param {Number} value The number.
 * @param {Integer} exp  The exponent (the 10 logarithm of the adjustment base).
 * @return {Number} The adjusted value.
 */
export function roundTo(value: any, exp: any) {
  // If the exp is undefined or zero...
  if (typeof exp === 'undefined' || +exp === 0) {
    return Math.round(value);
  }
  value = +value;
  exp = -+exp;
  // If the value is not a number or the exp is not an integer...
  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
    return NaN;
  }
  // Shift
  value = value.toString().split('e');
  value = Math.round(+(value[0] + 'e' + (value[1] ? +value[1] - exp : -exp)));
  // Shift back
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? +value[1] + exp : exp));
}
