import * as Is from './is';
import { TclError } from './tclerror';
import { Tcl } from './tcl';

export class Lexer {
  // Initialize current read position
  pos = 0;
  // Initialize word index counter
  wordIdx = 0;
  // Initialize the currently processing char and the to be processed input
  currentChar: string;
  input: string;
  // Initialize current sentence, this is used for linking the source code with the runnable result
  currentSentence: string = '';

  /**
   * Create a new lexer with the given code
   *
   * @param  {string} input - Tcl code to be run over by the lexer
   */
  public constructor(input: string) {
    this.input = input;
    // Set the currently processing char
    this.currentChar = this.input.charAt(0);
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
    this.currentSentence += old;
    return old;
  }

  /**
   * Keeps reading chars until the current char is not a whitespace character
   *
   * @returns void
   */
  private readWhitespace(): void {
    while (Is.Whitespace(this.currentChar)) {
      this.read();
    }
  }

  /**
   * Keeps reading chars until an endline character
   *
   * @returns void
   */
  private readComment(): void {
    while (this.pos < this.input.length && this.currentChar !== '\n') {
      this.read();
    }
  }

  /**
   * Keeps reading chars until the next command is hit
   *
   * @returns void
   */
  private readEndOfCommand(): void {
    while (Is.WordSeparator(this.currentChar)) {
      this.read();
    }
  }

  /**
   * Read a word that has brackets, it managages the bracket depth and checks if this is correct and eventually return the complete result
   * 
   * @param  {boolean} keepOuterBracket - To include the most outer brackets in the returned string, or to leave them out
   * @param  {string} openingBracket - The opening bracket to use for checking
   * @param  {string} closingBracket - The closing bracket to use for checking
   * @returns WordToken - The processed result
   */
  private nextBracketWord(
    keepOuterBracket: boolean,
    openingBracket: string,
    closingBracket: string,
  ): WordToken {
    // Initiliaze the delimiter array
    let delimiters: Array<string> = [];
    // This delimiter array is used for keeping track of opening an closing brackets, and thus making sure read until the last corresponding bracket
    // E.g. `this is {some "code {to}" parse} with [the lexer]` => ['this', 'is', 'some "code {to}" parse', 'with', 'the lexer']
    // and not `this is {some "code {to}" parse} with [the lexer]` => ['this', 'is', 'some "code {to', '}" parse}', 'with', 'the lexer']

    // Initialize an empty wordtoken to eventually return
    let out: WordToken = {
      value: '',
      hasVariable: false,
      hasSubExpr: false,
      stopBackslash: false,
      index: this.wordIdx,
      lastSentence: '',
    };

    /**
     * Tests a char for being an opening delimiter adds the necessary end delimiter to the array
     *
     * @param  {string} test - The char to test for opening delimiters
     * @returns number - If a delimiter was added: the amount of delimiters, If not: -1
     */
    function testOpenDelimiters(test: string): number {
      if (test === openingBracket) {
        delimiters.push(closingBracket);
        return delimiters.length;
      }
      return -1;
    }

    /**
     * Tests a char for being a closing delimiter removes the necessary end delimiters from the array
     *
     * @param  {string} test - The char to test for closing delimiters
     * @returns number - If a delimiter was removed: the amount of delimiters, If not: -1
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
      // Test for opening delimiters
      let opening = testOpenDelimiters(this.currentChar);
      // If it was the first one, dont add it to the output
      if (opening === 1 && !keepOuterBracket) {
        this.read();
        continue;
      }

      // Test for closing delimiters
      let closing = testCloseDelimiters(this.currentChar);
      // If it was the last delimiter, dont add it to the output
      if (closing === 0 && !keepOuterBracket) {
        this.read();
        continue;
      }

      // Check if this is the end and leave if so
      if (testEndOfWord(this.currentChar)) break;

      // If the program finds new characters after the last delimiter, throw an error
      // This will only happen if someone appends text after a brace: E.g. `puts {hello}world`
      if (delimiters.length === 0 && closing === -1)
        throw new TclError('extra characters after close-brace:');

      // If a \ is found just add the character following the \ to the word without processing it
      if (this.currentChar === '\\') out.value += this.read();
      out.value += this.read();
    }

    // If there are still delimiters left, that means that there are non matching brackets
    if (delimiters.length > 0) throw new TclError('missing close-brace');

    // Change the word index
    this.wordIdx += 1;
    return out;
  }

  /**
   * Reads the input until the next found quote
   * 
   * @returns WordToken - The processed word
   */
  private nextQuoteWord(): WordToken {
    // Check if the function was called when necessary
    if (this.currentChar !== '"')
      throw new TclError('nextQuoteWord was called without a quote exisiting');

    // Discard the opening quote
    this.read();

    // Intialize a token
    let out: WordToken = {
      value: '',
      hasVariable: false,
      hasSubExpr: false,
      stopBackslash: false,
      index: this.wordIdx,

      lastSentence: '',
    };

    // Keep reading chars as long as there is input and the char is not a quote
    while (this.pos < this.input.length && this.currentChar !== '"') {
      // Check if the word has subexpressions or variables
      if (this.currentChar === '[') out.hasSubExpr = true;
      if (this.currentChar === '$') out.hasVariable = true;

      // If a \ is found just add the character following the \ to the word without processing it
      if (this.currentChar === '\\') out.value += this.read();
      out.value += this.read();
    }

    // Discard the closing quote
    let close = this.read();
    // Check if this closing quote was and actual quote
    if (close !== '"') throw new TclError('missing "');

    // Check if the next char is word-seperator, if not there is incorrect user input
    if (!Is.WordSeparator(this.currentChar))
      throw new TclError('extra characters after close-quote');

    // Change the word index
    this.wordIdx += 1;
    return out;
  }

  /**
   * Reads the input until a word seperator is found
   * 
   * @returns WordToken - The processed word
   */
  private nextSimpleWord(): WordToken {
    // Initialize a token
    let out: WordToken = {
      value: '',
      hasVariable: false,
      hasSubExpr: false,
      stopBackslash: false,
      index: this.wordIdx,
      lastSentence: '',
    };

    // Keep reading chars as long as there is input and the char is not a word-seperator
    while (
      this.pos < this.input.length &&
      !Is.WordSeparator(this.currentChar)
    ) {
      // Check if the word has subexpressions or variables
      if (this.currentChar === '[') out.hasSubExpr = true;
      if (this.currentChar === '$') out.hasVariable = true;

      // If a \ is found just add the character following the \ to the word without processing it
      if (this.currentChar === '\\') out.value += this.read();
      out.value += this.read();
    }
    // Change the word index
    this.wordIdx += 1;
    return out;
  }

  private getNextToken(): WordToken | null {
    // Get rid of all whitespace
    this.readWhitespace();

    // Check if there is still input to read
    if (this.pos >= this.input.length) {
      return null;
    }

    switch (true) {
      // Check if the first character of a new line is a #
      case this.wordIdx === 0 && this.currentChar === '#':
        // If so skip the comment
        this.readComment();

        // And return the next token
        return this.nextToken();

      // Check if the current character is a command delimiter
      case Is.CommandDelimiter(this.currentChar):
        // If so skip until next command
        this.readEndOfCommand();

        // Reset the word index and return the next token
        this.wordIdx = 0;
        this.currentSentence = '';
        return this.nextToken();

      // Check if the current char is a {
      case this.currentChar === '{': {
        // Read the word with the outer most brackets removed
        let word = this.nextBracketWord(false, '{', '}');

        // Disable backslashes on this word
        word.stopBackslash = true;
        return word;
      }
      // Check if the current char is a [
      case this.currentChar === '[': {
        // Read the word with the outer most brackets included
        let word = this.nextBracketWord(true, '[', ']');

        // Enable subexpression parsing
        word.hasSubExpr = true;
        return word;
      }
      // Check if the current char is "
      case this.currentChar === '"':
        return this.nextQuoteWord();

      // If none of the above, just return the current word
      default:
        return this.nextSimpleWord();
    }
  }

  /**
   * Makes the lexer process the input until a new complete word is found
   *
   * @returns WordToken - Returns null when the end of the input is hit
   */
  public nextToken(): WordToken | null {
    let token = this.getNextToken();
    if (token) token.lastSentence = this.currentSentence;
    return token;
  }
}

// An interface to hold every generated token
export interface WordToken {
  value: string;
  index: number;
  hasVariable: boolean;
  hasSubExpr: boolean;
  stopBackslash: boolean;
  lastSentence: string;
}
