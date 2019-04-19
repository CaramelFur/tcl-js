import * as Is from './is';
import { TclError } from './tclerror';

export class Lexer {
  // Initialize current read position
  pos = 0;
  // Initialize word index counter
  wordIdx = 0;
  // Initialize the currently processing char and the to be processed input
  currentChar: string;
  input: string;

  /**
   * Create a new lexer with the given code
   *
   * @param  {string} input - Tcl code to be run over by the lexer
   */
  constructor(input: string) {
    this.input = input;
    // Set the currently processing char
    this.currentChar = input.charAt(0);
  }

  /**
   * Progresses the currently processing char by one
   *
   * @returns string - The previous character
   */
  private read(): string {
    let old = this.currentChar;
    this.pos += 1;
    this.currentChar = this.input.charAt(this.pos);
    return old;
  }

  /**
   * Keeps reading chars until the current char is not a whitespace character
   *
   * @returns void
   */
  private skipWhitespace(): void {
    while (Is.Whitespace(this.currentChar)) {
      this.read();
    }
  }

  /**
   * Keeps reading chars until an endline character
   *
   * @returns void
   */
  private skipComment(): void {
    while (this.pos < this.input.length && this.currentChar !== '\n') {
      this.read();
    }
  }

  /**
   * Keep reading the input until a whole word has formed
   * 
   * @param  {string} delimiterIn? - A delimiter to already add to the delimiter list
   * @returns WordToken - The found word
   */
  private scanWord(delimiterIn?: string): WordToken {
    // Initiliaze the delimiter array and add the parsed delimiter if necessary
    let delimiters: Array<string> = [];
    if (delimiterIn) delimiters.push(delimiterIn);
    // This delimiter array is used for keeping track of opening an closing brackets, and thus making sure read until the last corresponding bracket
    // E.g. `this is {some "code {to}" parse} with [the lexer]` => ['this', 'is', 'some "code {to}" parse', 'with', 'the lexer']
    // and not `this is {some "code {to}" parse} with [the lexer]` => ['this', 'is', 'some "code {to', '}" parse}', 'with', 'the lexer']

    // Initialize variable to tell code to ignore most outer delimiters
    let ignoreLastDelimiter = false;

    // Initialize an empty wordtoken to eventually return
    let out: WordToken = {
      value: '',
      hasVariable: false,
      hasSubExpr: false,
      index: this.wordIdx,
    };
 
    /**
     * Tests a char for being a delimiter adds the necessary end delimiters to the array
     * 
     * @param  {string} test - The char to test for delimiters
     * @returns number - If a delimiter was added: the amount of delimiters, If not: 0
     */
    function testDelimiters(test: string): number {
      switch (test) {
        case '{':
          delimiters.push('}');
          return delimiters.length;
        case '"':
          delimiters.push('"');
          return delimiters.length;
        case '[':
          delimiters.push(']');
          return delimiters.length;
      }
      return 0;
    }

    /**
     * Check if the wordscanner has hit the end of the word
     * Returns an EndWordType:
     * - CONTINUE: Nothing happend, continue reading chars
     * - END: There are no more chars to read, return the word you currently have
     * - POPPED: We have exited a delimiter, 
     * 
     * @param  {string} test
     * @returns EndWordType - State of word
     */
    function testEndOfWord(test: string): EndWordType {
      // Check if we are currently in any delimiters
      if (delimiters.length > 0) {
        // Create a new variable with the last delimiter
        let delimiter = delimiters[delimiters.length - 1];

        // Check if the current character is that delimiter
        if (test === delimiter) {
          // Check if there is only 1 delimiter left
          // If so keep it in the array and return the END enum
          if (delimiters.length === 1) return EndWordType.END;

          // If there are more than 1 delimiters left, pop 1 delimiter and return the POPPED enum
          delimiters.pop();
          return EndWordType.POPPED;
        }

        // The current character is not the delimiter so just return CONTINUE
        return EndWordType.CONTINUE;
      }

      // If not just check if the current character is a wordseperator or not
      return Is.WordSeparator(test) ? EndWordType.END : EndWordType.CONTINUE;
    }

    // Keep reading chars as long as there is input
    while (this.pos < this.input.length) {
      // Set the current endwordstate to a variable
      let isEnd = testEndOfWord(this.currentChar);

      // Check if the state is END
      if (isEnd === EndWordType.END) {
        // Check if the current char is equals to the last delimiter
        // If so skip that char
        if (this.currentChar === delimiters.pop()) this.read();
        // Exit the reading loop
        break;
      }

      // Set the hasvariable boolean if
      out.hasVariable =
        delimiters.indexOf('}') < 0 && // We are not within {}
        delimiters.indexOf(']') < 0 && // We are not withing []
        (out.hasVariable || this.currentChar === '$'); // The current char is $ or it was already true

      // Set the hasSubexpression variable if
      out.hasSubExpr =
        delimiters.indexOf('}') < 0 && // We are not within {}
        (out.hasSubExpr || delimiters[0] === ']'); // The most outer delimiter is [] or it was already true

      // Check if the last test did not pop a delimiter of the array
      // This is done so we dont immediately add it back to array causing errors
      if (isEnd !== EndWordType.POPPED) {
        // Test for delimiters and add the new array length to a variable
        let newLength = testDelimiters(this.currentChar);

        // Check if the newlength is 1 and the outvalue still empty, meaning that the first char is a delimiter
        if (out.value === '' && newLength === 1) {
          // Tell code to ignore the last delimiter
          ignoreLastDelimiter = true;

          // Skip the character and go to the next loop
          this.read();
          continue;
        }
      }

      // Add the character to the outbuffer
      out.value += this.read();
    }

    // If there are still delimiters left, that means that there are non matching brackets or there is one left to not parse
    if (delimiters.length > 0) {
      // If it is not the end of the word, throw an error
      if (testEndOfWord(this.currentChar) !== EndWordType.END) {
        throw new TclError('parse error: unexpected end of input');
      }

      // Otherwise just skip the last delimiter
      this.read();
    }

    // Change the word index
    this.wordIdx += 1;
    return out;
  }

  /**
   * Keeps reading chars until the next command is hit
   *
   * @returns void
   */
  private skipEndOfCommand(): void {
    while (Is.WordSeparator(this.currentChar)) {
      this.read();
    }
  }

  /**
   * Makes the lexer process the input until a new complete word is found
   *
   * @returns WordToken - Returns null when the end of the input is hit
   */
  nextToken(): WordToken | null {
    // Get rid of all whitespace
    this.skipWhitespace();

    // Check if there is still input to read
    if (this.pos >= this.input.length) {
      return null;
    }

    // Check if the first character of a new line is a #
    if (this.wordIdx === 0 && this.currentChar === '#') {
      // If so skip the comment
      this.skipComment();

      // And return the next token
      return this.nextToken();
    }
    // Check if the current character is a command delimiter
    else if (Is.CommandDelimiter(this.currentChar)) {
      // If so skip until next command
      this.skipEndOfCommand();

      // Reset the word index and return the next token
      this.wordIdx = 0;
      return this.nextToken();
    }
    // If none of the above, just return the current word
    else {
      return this.scanWord();
    }
  }
}

// An interface to hold every generated token
export interface WordToken {
  value: string;
  index: number;
  hasVariable: boolean;
  hasSubExpr: boolean;
}

// An enum to differentiate between what happend
enum EndWordType {
  CONTINUE,
  END,
  POPPED,
}
