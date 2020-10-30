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
  -> %expandSign:? nonExpansionWord {% ([expand,word]) => word.setExpand(!!expand) %}

nonExpansionWord
  ->  simpleWord {% id %}
   |  quotedWord {% id %}
   |  bracedWord {% id %}
  
simpleWord
  ->  %wordchar:+ {% ([chars]) => new TclWord(chars.join('')) %}

quotedWord
  -> %quote %wordchar:+ {% ([quote,chars]) => new TclWord(chars.slice(0, -1).join('')) %}

bracedWord
  -> %lbrace %wordchar:+ {% ([quote,chars]) => new TclWord(chars.slice(0, -1).join(''), TclWordTypes.brace) %}