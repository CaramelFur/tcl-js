import { Parser } from 'expr-eval';

let parser = new Parser();
let result = parser.parse("-3");

console.log(result.evaluate());