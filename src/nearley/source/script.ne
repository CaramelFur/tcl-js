@{%
  import { lexer } from '../lexers/main';

  import {
    TclScript,
    TclCommand,
    TclComment,
  } from '../../parser/TclToken';
%}

@lexer lexer

script 
  ->  statementList {% ([list]) => new TclScript(list) %}

statementList
  ->  comments {% id %}
   |  commands {% id %}
  
comments
  ->  comment %nl _ statementList
        {% 
          ([comment,,,list]) => [comment, ...list]
        %}
   |  comment

commands
  ->  command _ commandSeperator _ statementList
        {% 
          ([command,,,,list]) => [command, ...list] 
        %}
   |  command

comment
  ->  %hashTag %comment:?
        {% ([,comment]) => new TclComment(comment || "") %}

command
  ->  list
        {% ([words]) => new TclCommand(words || []) %}
  
@include "../import/list.ne"
@include "../import/basics.ne"
