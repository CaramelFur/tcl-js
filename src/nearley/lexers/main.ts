import * as moo from 'moo';

export const lexer = (() => {
  const wsregex = /[ \t\v\f\r]/;

  const escapeRegex = /\\.|[^\\]|\\/;

  const pop = (amount: number) => (value: string) => {
    for (let i = 0; i < amount; i++) lexer.popState();
    return value;
  };

  const push = (...pushes: string[]) => (value: string) => {
    for (let i = 0; i < pushes.length; i++) lexer.pushState(pushes[i]);
    return value;
  };

  return moo.states(
    {
      main: {
        nl: { match: '\n', lineBreaks: true },
        ws: wsregex,
        semiColon: ';',
        hashTag: { match: '#', push: 'comment' },
        expandSign: { match: '{*}' },

        lbrace: { match: '{', push: 'braceWord' },
        quote: { match: '"', push: 'quoteWord' },

        wordchar: [
          { match: '$', value: push('word', 'variable') },
          { match: '[', value: push('word', 'bracketreplace') },
          { match: escapeRegex, lineBreaks: true, push: 'word' },
        ],
      },
      comment: {
        comment: /[^\n]+/,
        nl: { match: '\n', lineBreaks: true, pop: 1 },
      },

      word: {
        nl: { match: '\n', lineBreaks: true, pop: 1 },
        ws: { match: wsregex, pop: 1 },
        semiColon: { match: ';', pop: 1 },
        wordchar: [
          { match: '$', push: 'variable' },
          { match: '[', push: 'bracketreplace' },
          { match: escapeRegex, lineBreaks: true },
        ],
      },
      quoteWord: {
        wordchar: [
          { match: '"', pop: 1 },
          { match: '$', push: 'variable' },
          { match: '[', push: 'bracketreplace' },
          { match: escapeRegex, lineBreaks: true },
        ],
      },

      variable: {
        nl: { match: '\n', lineBreaks: true, value: pop(2) },
        ws: { match: wsregex, value: pop(2) },
        semiColon: { match: ';', value: pop(2) },
        wordchar: [
          { match: '(', push: 'subvariable' },
          { match: /[a-zA-Z0-9_]|::/ },
          { match: escapeRegex, lineBreaks: true, pop: 1 },
        ],
      },
      subvariable: {
        wordchar: [
          { match: '[', push: 'bracketreplace' },
          { match: '$', push: 'variable' },
          { match: ')', pop: 1 },
          { match: escapeRegex, lineBreaks: true },
        ],
      },

      bracketreplace: {
        wordchar: [
          { match: '[', push: 'bracketreplace' },
          { match: ']', pop: 1 },
          { match: escapeRegex, lineBreaks: true },
        ],
      },

      braceWord: {
        wordchar: [
          { match: '{', push: 'braceWord' },
          { match: '}', pop: 1 },
          { match: escapeRegex, lineBreaks: true },
        ],
      },
    },
    'main',
  );
})();
