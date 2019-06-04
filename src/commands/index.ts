import { Load as puts } from './puts';
import { Load as basic } from './basic';
import { Load as list } from './list';
import { Load as proc } from './proc';
import { Load as iff } from './if';
import { Load as switchh } from './switch';
import { Load as whilee } from './loops';
import { Scope } from '../scope';

// Import all loadfunctions and add them to the array
let LoadFunctions: Array<(scope: Scope) => void> = [
  puts,
  basic,
  list,
  proc,
  iff,
  switchh,
  whilee,
];

export { LoadFunctions };
