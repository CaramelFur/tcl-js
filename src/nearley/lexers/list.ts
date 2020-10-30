import * as moo from 'moo';
import { createPop, createPush, escapeRegex, nlwsregex } from './base';

export const listlexer = (() => {
  const pop = createPop(() => listlexer);

  const push = createPush(() => listlexer);

  return moo.states(
    {
      main: {
        ws: { match: nlwsregex, lineBreaks: true },

        lbrace: { match: '{', push: 'braceWord' },
        quote: { match: '"', push: 'quoteWord' },

        wordchar: [
          { match: '$', value: push('word', 'variable') },
          { match: '[', value: push('word', 'bracketreplace') },
          { match: escapeRegex, push: 'word', lineBreaks: true },
        ],
      },

      word: {
        ws: { match: nlwsregex, pop: 1, lineBreaks: true },
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
            match: /\\.|[^\\]|\\(?=[ \t\v\f\r\n])/,
            value: pop(2),
            lineBreaks: true,
          },
          { match: escapeRegex, pop: 1, lineBreaks: true },
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
