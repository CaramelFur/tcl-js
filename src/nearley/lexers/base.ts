export const wsregex = /[ \t\v\f\r]/;

export const escapeRegex = /\\.|[^\\]|\\/;

export const advancedEscapeRegex = /\\(?:[0-7]{1,3}|x[0-9a-fA-F]{1,2}|u[0-9a-fA-F]{1,4}|U[0-9a-fA-F]{1,8}|.)/;

export const dot = /./;

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
