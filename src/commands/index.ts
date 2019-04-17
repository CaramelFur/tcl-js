import { Load as puts } from './puts';
import { Load as basic } from './basic';
import { Load as list } from './list';
import { Load as proc } from './proc';
import { Scope } from '../scope';

let LoadFunctions: Array<(scope: Scope) => void> = [puts, basic, list, proc];

export { LoadFunctions };
