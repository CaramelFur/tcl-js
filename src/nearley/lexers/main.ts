import * as moo from 'moo';
import { createPop, createPush, escapeRegex, wsregex } from './base';

export const lexer = (() => {
  const pop = createPop(() => lexer);

  const push = createPush(() => lexer);

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
        wordchar: [
          { match: '(', push: 'subvariable' },
          { match: /[a-zA-Z0-9_]|::/ },
          { match: '$', next: 'variable' },
          { match: '[', next: 'bracketreplace' },
          {
            match: /\\.|[^\\]|\\(?=[ \t\v\f\r\n;])/,
            value: pop(2),
            lineBreaks: true,
          },
          { match: escapeRegex, lineBreaks: true, pop: 1 },
        ],
      },
      subvariable: {
        wordchar: [
          { match: '[', push: 'bracketreplace' },
          { match: '$', push: 'variable' },
          { match: ')', value: pop(2) },
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
