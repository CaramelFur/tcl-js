import { Load as puts } from './puts';
import { Load as basic } from './basic';
import { Load as list } from './list';
import { Load as proc } from './proc';
import { Scope } from '../scope';

// Import all loadfunctions and add them to the array
let LoadFunctions: Array<(scope: Scope) => void> = [puts, basic, list, proc];

export { LoadFunctions };
