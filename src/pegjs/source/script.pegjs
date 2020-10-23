{
  const {
    //TclWordPartTypes,
    TclWordTypes,

    TclScript,
    TclCommand,
    TclComment,
    TclWord,
    //TclWordPart,
    //TclVariable,
  } = require('../../parser/TclToken.ts');
}

script = list:statementlist { return list; }

statementlist
  = commandlist
  / commentlist

commandlist
  = firstcommand:command _ commandSeperator _ otherstatements:statementlist {
      return otherstatements.prepend(firstcommand);
    }
  / firstcommand:command { return new TclScript([firstcommand]); }

commentlist
  = cmnt:comment newLineChar _ otherstatements:statementlist {
      return otherstatements.prepend(cmnt);
    }
  / cmnt:comment { return new TclScript([cmnt]); }

comment = pound chars:nonNewLineChar* { return new TclComment(chars.join('')); }

command = !pound words:words? { return new TclCommand(words || []); }

// Words ========================

//import "../import/words"

//import "../import/basics"
