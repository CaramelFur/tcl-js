import { Parser } from '../../src/math/parser';
//import {Parser} from 'expr-eval'
import * as util from 'util';

// alternative shortcut


let parser = new Parser({operators:{in:true}});
let result = parser.parse('"hi" in hello,hi,hello');
result = result.evaluate();
console.log(result);
