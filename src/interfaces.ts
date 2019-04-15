import { WordToken } from './lexer';

export interface Variable {
  type: string;
  value: string;
  start: number;
  end: number;
}

export interface Statement {
  type: string;
  words: Array<WordToken>;
}

export interface Program {
  type: string;
  statements: Array<Statement>;
}
