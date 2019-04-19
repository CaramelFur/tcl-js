import * as Is from './is';
import { TclError } from './tclerror';
import { read } from 'fs';

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

    // Initialize variable to tell the code to search for delimiters
    let hasDelimiters = delimiters.length > 0;

    // Initialize an empty wordtoken to eventually return
    let out: WordToken = {
      value: '',
      hasVariable: false,
      hasSubExpr: false,
      index: this.wordIdx,
    };

    /**
     * Tests a char for being an opening delimiter adds the necessary end delimiters to the array
     *
     * @param  {string} test - The char to test for opening delimiters
     * @returns number - If a delimiter was added: the amount of delimiters, If not: 0
     */
    function testOpenDelimiters(test: string): number {
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
      return -1;
    }

    /**
     * Tests a char for being a closing delimiter removes the necessary end delimiters from the array
     *
     * @param  {string} test - The char to test for closing delimiters
     * @returns number - If a delimiter was removed: the amount of delimiters, If not: 0
     */
    function testCloseDelimiters(test: string): number {
      if (test === delimiters[delimiters.length - 1]) {
        delimiters.pop();
        return delimiters.length;
      }
      return -1;
    }

    /**
     * Check if the wordscanner has hit the end of the word
     * Returns a boolean:
     * - false: Nothing happend, continue reading chars
     * - true: There are no more chars to read, return the word you currently have
     *
     * @param  {string} test
     * @returns boolean - Is end of word
     */
    function testEndOfWord(test: string): boolean {
      // Check if we are currently in any delimiters
      if (delimiters.length > 0) {
        // If so return false
        return false;
      }

      // If not check if the current character is a wordseperator or not
      return Is.WordSeparator(test);
    }

    // Keep reading chars as long as there is input
    while (this.pos < this.input.length) {
      // Only check for delimiters if previous ones have been found, or we are at the first character of the word
      if (out.value === '' || hasDelimiters) {
        // Test for closing delimiters
        let closing = testCloseDelimiters(this.currentChar);

        // Check if closing delmiters are found
        if (closing !== -1) {
          // If it was the last delimiter, dont add it to the output
          if (closing === 0) {
            this.read();
            continue;
          }
        } 
        // If not
        else {
          // Test for opening delimiters
          let opening = testOpenDelimiters(this.currentChar);

          // If they are found tell the program to keep searching
          if (opening > 0) hasDelimiters = true;

          // If it was the first one, dont add it to the output
          if (opening === 1) {
            this.read();
            continue;
          }
        }
      }

      // Check if this is the end and leave if so
      if (testEndOfWord(this.currentChar)) break;

      // If the program has previously found delimiters but the delimiter array is empty, throw an error
      // This will only happen if someone appends text after a brace: E.g. `puts {hello}world`
      if (hasDelimiters && delimiters.length === 0)
        throw new TclError('extra characters after close-brace');

      // Set the hasvariable boolean if
      out.hasVariable =
        delimiters.indexOf('}') < 0 && // We are not within {}
        delimiters.indexOf(']') < 0 && // We are not withing []
        (out.hasVariable || this.currentChar === '$'); // The current char is $ or it was already true

      // Set the hasSubexpression variable if
      out.hasSubExpr =
        delimiters.indexOf('}') < 0 && // We are not within {}
        (out.hasSubExpr || delimiters[0] === ']'); // The most outer delimiter is [] or it was already true

      // Add the character to the outbuffer
      out.value += this.read();
    }

    // If there are still delimiters left, that means that there are non matching brackets
    if (delimiters.length > 0)
      throw new TclError('parse error: unexpected end of input');

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
