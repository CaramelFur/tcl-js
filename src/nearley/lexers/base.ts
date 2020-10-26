export const wsregex = /[ \t\v\f\r]/;

export const escapeRegex = /\\.|[^\\]|\\/;

export const createPop = (lexer: () => moo.Lexer) => (amount: number) => (
  value: string,
): string => {
  for (let i = 0; i < amount; i++) lexer().popState();
  return value;
};

export const createPush = (lexer: () => moo.Lexer) => (...pushes: string[]) => (
  value: string,
): string => {
  for (let i = 0; i < pushes.length; i++) lexer().pushState(pushes[i]);
  return value;
};
