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
          ([command,ws1,sp,ws2,list]) => {
            if (list[0].line === 0 && list[0].col === 0) {
              list[0].line = (ws2 || sp).line;
              list[0].col = (ws2 || sp).col;
            }
            return [command, ...list] ;
          }
        %}
   |  command

comment
  ->  %hashTag %comment:?
        {% ([hashtag,comment]) => new TclComment(comment || "", hashtag.line, hashtag.col) %}

command
  ->  list
        {% ([words] = []) => words.length === 0 ? new TclCommand(words, 0, 0) : new TclCommand(words, words[0].line, words[0].col) %}
  
@include "../import/list.ne"
@include "../import/basics.ne"
