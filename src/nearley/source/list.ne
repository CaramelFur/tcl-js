@{%
  import { listlexer as lexer } from '../lexers/list';
%}

@lexer lexer

main -> list {% id %}

@include "../import/list.ne"