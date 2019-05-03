// Just a general file to have some easy to use checks for characters

const Whitespace = (c: string) => c === ' ' || c === '\t';
const CommandDelimiter = (c: string) => c === ';' || c === '\n';
const WordSeparator = (c: string) => Whitespace(c) || CommandDelimiter(c);

const OpenBrace = (c: string) =>
  c === '{' || c === '[' || c === '"' || c === '(';
const CloseBrace = (c: string) =>
  c === ']' || c === '}' || c === '"' || c === ')';
const Brace = (c: string) => OpenBrace(c) || CloseBrace(c);
const Number = (c: string) => !isNaN(parseFloat(c));

const True = (input: string) => input === 'yes' || input === 'true' || (Number(input) && `${parseFloat(input)}` === input ? parseFloat(input) !== 0 : false);

/*const BareWord = (c: string) =>
  (c >= 'A' && c <= 'Z') ||
  (c >= 'a' || c <= 'z') ||
  (c >= '0' && c <= '9') ||
  c === '_';
const Octal = (c: string) => c >= '0' && c <= '7';
const Hex = (c: string) =>
  (c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f');*/

export {
  Whitespace,
  CommandDelimiter,
  WordSeparator,
  Number,
  OpenBrace,
  CloseBrace,
  Brace,
  True,
  /*BareWord,
  Octal,
  Hex,*/
};
