import { Load as puts } from './puts';
import { Load as basic } from './basic';
import { Load as list } from './list';

let LoadFunctions: Array<Function> = [puts, basic, list];

export { LoadFunctions };
