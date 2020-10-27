import * as moo from 'moo';
import { advancedEscapeRegex, createPop, dot } from './base';

export const wordLexer = (() => {
  const pop = createPop(() => wordLexer);

  return moo.states(
    {
      main: {
        dollar: { match: '$', push: 'variable' },
        lbracket: { match: '[', push: 'bracketreplace' },
        escape: { match: advancedEscapeRegex },

        char: { match: dot },
      },
      variable: {
        lparen: { match: '(', push: 'subvariable' },

        variablechar: { match: /[a-zA-Z0-9_]|::/ },

        dollar: { match: '$', next: 'variable' },
        lbracket: { match: '[', next: 'bracketreplace' },

        escape: { match: advancedEscapeRegex, pop: 1 },
        char: { match: dot, pop: 1 },
      },
      subvariable: {
        lbracket: { match: '[', push: 'bracketreplace' },
        dollar: { match: '$', push: 'variable' },

        rparen: { match: ')', value: pop(2) },

        escape: { match: advancedEscapeRegex },

        char: { match: dot, lineBreaks: true },
      },

      bracketreplace: {
        lbracket: { match: '[', push: 'bracketreplace' },
        rbracket: { match: ']', pop: 1 },

        bracketchar: { match: dot, lineBreaks: true },
      },
    },
    'main',
  );
})();
