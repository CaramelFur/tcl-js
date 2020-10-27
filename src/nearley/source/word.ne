@{%
  import { wordLexer } from '../lexers/word';

  import {
    AnyWordPart,
    TextPart,
    EscapePart,
    CodePart,
    VariablePart,
  } from '../../parser/WordToken';
%}

@lexer wordLexer

#dump -> .:* {% ([ar]) => ar.map((e: any) => e.type + ":" + e.value) %}

word
  ->  textpart nontextparts:? {% ([part, parts]) => parts ? [part, ...parts] : [part] %}
   |  nontextparts {% id %}

nontextparts
  -> nontextpart word:? {% ([part, word]) => word ? [part, ...word] : [part] %}

nontextpart
  ->  escapepart {% id %}
   |  variablepart {% id %}
   |  codepart {% id %}

textpart
  ->  %char:+ {% ([chars]) => new TextPart(chars.join('')) %}

escapepart
  ->  %escape {% ([escape]) => new EscapePart(escape.toString()) %}

variablepart
  ->  %dollar %variablechar:* variableindex:? {% ([,name,index]) => new VariablePart(name.join(''), index) %}

variableindex
  ->  %lparen word %rparen {% ([,word,]) => word %}

codepart
  ->  %lbracket %bracketchar:* %rbracket {% ([,chars,]) => new CodePart(chars.join('')) %}
