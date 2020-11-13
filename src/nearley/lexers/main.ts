import * as moo from 'moo';
import {
  createPop,
  createPush,
  escapeNlRegex,
  escapeRegex,
  wsregex,
} from './base';

export const lexer = (() => {
  const pop = createPop(() => lexer);

  const push = createPush(() => lexer);

  const retWS = () => ' ';

  // Its a miracle this actually works, its such a mess

  return moo.states(
    {
      main: {
        nl: { match: '\n', lineBreaks: true },
        ws: [
          { match: wsregex },
          { match: escapeNlRegex, value: retWS, lineBreaks: true },
        ],
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
        comment: [
          { match: /[^\n]+/ },
          { match: escapeNlRegex, value: retWS, lineBreaks: true },
        ],
        nl: { match: '\n', lineBreaks: true, pop: 1 },
      },

      word: {
        nl: { match: '\n', lineBreaks: true, pop: 1 },
        ws: [
          { match: wsregex, pop: 1 },
          { match: escapeNlRegex, value: retWS, lineBreaks: true, pop: 1 },
        ],
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
          { match: escapeNlRegex, value: retWS, lineBreaks: true },
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
            // Escape regex folled by a word ender
            match: /(?:\\.|[^\\]|)(?=[ \t\v\f\r\n;]|\\\n[ \t\v\f\r]*)/,
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
          { match: escapeNlRegex, value: retWS, lineBreaks: true },
          { match: escapeRegex, lineBreaks: true },
        ],
      },

      bracketreplace: {
        wordchar: [
          { match: '[', push: 'bracketreplace' },
          { match: ']', pop: 1 },
          { match: escapeNlRegex, value: retWS, lineBreaks: true },
          { match: escapeRegex, lineBreaks: true },
        ],
      },

      braceWord: {
        wordchar: [
          { match: '{', push: 'braceWord' },
          { match: '}', pop: 1 },
          { match: escapeNlRegex, value: retWS, lineBreaks: true },
          { match: escapeRegex, lineBreaks: true },
        ],
      },
    },
    'main',
  );
})();
