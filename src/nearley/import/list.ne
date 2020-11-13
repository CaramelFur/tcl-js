@{%
  import {
    TclWordTypes,
    TclWord
  } from '../../parser/TclToken';
%}

@lexer lexer

@include "./basics.ne"

list
  ->  filledlist {% id %}
   |  null

filledlist
  ->  filledlist __ word
        {% 
          ([list,,word]) => [...list, word]
        %}
   |  word

word
  -> %expandSign:? nonExpansionWord {% ([expand,word]) => expand ? word.setExpand(expand, expand.line, expand.col) : word %}

nonExpansionWord
  ->  simpleWord {% id %}
   |  quotedWord {% id %}
   |  bracedWord {% id %}
  
simpleWord
  ->  %wordchar:+ {% ([chars]) => new TclWord(chars.join(''), chars[0].line, chars[0].col) %}

quotedWord
  -> %quote %wordchar:+ {% ([quote,chars]) => new TclWord(chars.slice(0, -1).join(''), quote.line, quote.col) %}

bracedWord
  -> %lbrace %wordchar:+ {% ([lbrace,chars]) => new TclWord(chars.slice(0, -1).join(''), lbrace.line, lbrace.col, TclWordTypes.brace) %}