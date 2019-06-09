import * as Is from './is';
import { TclError } from './tclerror';

/**
 * This class reads a raw tcl and allows you to keep requesting tokens until the whole tcl code is processed
 *
 * @export
 * @class Lexer
 */
export class Lexer {
  // Initialize current read position
  private pos = 0;
  // Initialize word index counter
  private wordIdx = 0;
  // Initialize the currently processing char and the to be processed input
  private currentChar: string;
  private input: string;
  // Initialize current sentence, this is used for linking the source code with the runnable result
  private currentSentence: string = '';
  private currentLine: number = 0;

  /**
   * Creates an instance of Lexer.
   * @param {string} input - Tcl code to be run over by the lexer
   * @memberof Lexer
   */
  public constructor(input: string) {
    this.input = input;
    // Set the currently processing char
    this.currentChar = this.input.charAt(0);
  }

  /**
   * Progresses the currently processing char by one
   *
   * @private
   * @returns {string} - The previous character
   * @memberof Lexer
   */
  private read(): string {
    let old = this.currentChar;

    // An internal function to read a char
    let subRead = () => {
      this.pos += 1;
      this.currentChar = this.input.charAt(this.pos);
      this.currentSentence += old;
      if (old === '\n') this.currentLine += 1;
    };

    // Read at least one
    subRead();

    // If there is an escaped endline, return a space with all whitechars removed
    if (this.currentChar === '\\' && this.input.charAt(this.pos + 1) === '\n') {
      subRead();
      this.currentChar = ' ';
      while (Is.WordSeparator(this.input.charAt(this.pos + 1))) {
        subRead();
      }
    }

    return old;
  }

  /**
   * Function to check if the current char is seperating a word
   *
   * @private
   * @returns {boolean}
   * @memberof Lexer
   */
  private hasMoreChars(): boolean {
    if (Is.WordSeparator(this.currentChar)) return false;
    if (this.currentChar === '') return false;
    return true;
  }

  /**
   * Keeps reading chars until the current char is not a whitespace character
   *
   * @private
   * @memberof Lexer
   */
  private readWhitespace(): void {
    while (Is.Whitespace(this.currentChar)) {
      this.read();
    }
  }

  /**
   * Keeps reading chars until an endline character
   *
   * @private
   * @memberof Lexer
   */
  private readComment(): void {
    while (this.pos < this.input.length && this.currentChar !== '\n') {
      this.read();
    }
  }

  /**
   * Keeps reading chars until the next command is hit
   *
   * @private
   * @memberof Lexer
   */
  private readEndOfCommand(): void {
    while (Is.WordSeparator(this.currentChar)) {
      this.read();
    }
  }

  /**
   * Makes the lexer process the input until a new complete word is found
   *
   * @returns {(WordToken | null)} - Returns null when the end of the input is hit
   * @memberof Lexer
   */
  public nextToken(): WordToken | null {
    let token = this.getNextToken();
    if (token) {
      token.source = this.currentSentence;
      token.sourceLocation = this.currentLine;
    }
    return token;
  }

  /**
   * Internal function for fetching a new token
   *
   * @private
   * @returns {(WordToken | null)}
   * @memberof Lexer
   */
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
        // Read the next brace word
        let word = this.nextBraceWord();

        // Disable backslashes on this word
        word.stopBackslash = true;
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
   * Reads a word that starts with { and parses everything in between correctly
   * Only call if currentChar is {
   *
   * @private
   * @returns {WordToken}
   * @memberof Lexer
   */
  private nextBraceWord(): WordToken {
    // Initialize some variables
    let out = this.newWordToken();
    let depth = 0;

    // While there is data to read
    while (this.pos < this.input.length) {
      if (this.currentChar === '}') {
        // Decrease the depth and skip the character if it is the outer most
        depth--;
        if (depth === 0) {
          this.read();
          break;
        }
      }
      if (this.currentChar === '{') {
        // Increase the depth and skip the character if it is the outer most
        depth++;
        if (depth === 1) {
          this.read();
          continue;
        }
      }

      // Break out of the function when we are back to a depth of 0
      if (depth === 0) break;

      // Handle escape characters and go to the next one
      if (this.currentChar === '\\') out.value += this.read();
      out.value += this.read();
    }

    // Check if the depth is correct
    if (depth !== 0) throw new TclError('uneven amount of curly braces');

    // Check for characters after closing brace
    if (this.hasMoreChars()) {
      // If this part is {*} try to expand
      if (out.value === '*') {
        // Get the next token to expand
        let test = this.getNextToken();
        out = <WordToken>test;
        out.expand = true;
      }

      // Otherwise throw an error
      else {
        throw new TclError('extra characters after close-brace');
      }
    }

    return out;
  }

  /**
   * Reads the input until the next found quote
   * Only call if currentchar is a quote
   *
   * @private
   * @returns {WordToken} - The processed word
   * @memberof Lexer
   */
  private nextQuoteWord(): WordToken {
    // Discard the opening quote
    this.read();

    // Intialize a token
    let out: WordToken = this.newWordToken();

    // Keep reading chars as long as there is input and the char is not a quote
    while (this.pos < this.input.length && this.currentChar !== '"') {
      // Check if the word has subexpressions or variables
      if (this.currentChar === '[') {
        out.value += this.readBrackets();
        out.hasSubExpr = true;
        out.hasVariable = true;
        continue;
      }
      if (this.currentChar === '$') {
        out.value += this.readVariable();
        out.hasSubExpr = true;
        out.hasVariable = true;
        continue;
      }

      // If a \ is found just add the character following the \ to the word without processing it
      if (this.currentChar === '\\') out.value += this.read();
      out.value += this.read();
    }

    // Discard the closing quote
    let close = this.read();
    // Check if this closing quote was and actual quote
    if (close !== '"') throw new TclError('missing "');

    // Check if the next char is word-seperator, if not there is incorrect user input
    if (this.hasMoreChars())
      throw new TclError('extra characters after close-quote');

    // Change the word index
    this.wordIdx += 1;
    return out;
  }

  /**
   * Reads the input until a word seperator is found
   *
   * @private
   * @returns {WordToken} - The processed word
   * @memberof Lexer
   */
  private nextSimpleWord(): WordToken {
    // Initialize a token
    let out: WordToken = this.newWordToken();

    // Keep reading chars as long as there is input and the char is not a word-seperator
    while (
      this.pos < this.input.length &&
      !Is.WordSeparator(this.currentChar)
    ) {
      // Check if the word has subexpressions or variables
      if (this.currentChar === '[') {
        out.value += this.readBrackets();
        out.hasSubExpr = true;
        out.hasVariable = true;
        continue;
      }
      if (this.currentChar === '$') {
        out.value += this.readVariable();
        out.hasSubExpr = true;
        out.hasVariable = true;
        continue;
      }

      // If a \ is found just add the character following the \ to the word without processing it
      if (this.currentChar === '\\') out.value += this.read();
      out.value += this.read();
    }
    // Change the word index
    this.wordIdx += 1;
    return out;
  }

  /**
   * Reads the input until the last closing bracket
   * Only call if currentchar is [
   *
   * @private
   * @returns {string}
   * @memberof Lexer
   */
  private readBrackets(): string {
    // Initialize some variables
    let output = '';
    let depth = 0;

    // While there is data to process
    while (this.pos < this.input.length) {
      // Ajust the depth
      if (this.currentChar === ']') depth--;
      if (this.currentChar === '[') depth++;

      // Handle escapes
      if (this.currentChar === '\\') output += this.read();
      output += this.read();

      // Break on last close
      if (depth === 0) break;
    }

    // Return the collected result
    return output;
  }

  /**
   * Function to read a variable completely and return the variable
   * Only call if currentchar is $
   *
   * @private
   * @returns {string}
   * @memberof Lexer
   */
  private readVariable(): string {
    // Initialize an output buffer
    let output = '';
    output += this.read();

    // Check if we have a curly variable
    if (this.currentChar === '{') {
      this.currentChar = <string>this.currentChar;

      // Keep reading until a closing curly is found
      while (this.pos < this.input.length && this.currentChar !== '}') {
        // Handle escapes
        if (this.currentChar === '\\') output += this.read();
        output += this.read();
      }

      // Return the string containing the variable
      return output;
    }

    // If it is not a curly variable keep reading while there is data
    while (this.pos < this.input.length) {
      // Check if the string has attached braces
      if (this.currentChar === '(') {
        this.currentChar = <string>this.currentChar;

        // If so, keep reading while there is data
        while (this.pos < this.input.length) {
          // If an endbrace is found, get out of the nested loop
          if (this.currentChar === ')') {
            output += this.read();
            break;
          }

          // If another variable is found within the braces
          if (this.currentChar === '$') {
            // Parse it using the same function we are currently in
            output += this.readVariable();
          }
          //  If not just move to the next character
          else {
            if (this.currentChar === '\\') output += this.read();
            output += this.read();
          }
        }

        // Check if we did escape because of the )
        if (this.pos > this.input.length) throw new TclError('missing )');

        // A closing brace
        return output;
      }

      // Break out of the loop if we hit the end of the variable
      if (
        Is.WordSeparator(this.currentChar) ||
        Is.Brace(this.currentChar) ||
        this.currentChar === '$' ||
        this.currentChar === '\\'
      ) {
        break;
      }

      output += this.read();
    }

    // And return the output
    return output;
  }

  /**
   * Generates a new empty wordtoken
   *
   * @private
   * @returns {WordToken} - The generated token
   * @memberof Lexer
   */
  private newWordToken(): WordToken {
    return {
      value: '',
      hasVariable: false,
      hasSubExpr: false,
      stopBackslash: false,
      index: this.wordIdx,
      expand: false,
      source: '',
      sourceLocation: 0,
    };
  }
}

/**
 * An interface to hold every generated token
 *
 * @export
 * @interface WordToken
 */
export interface WordToken {
  value: string;
  index: number;
  hasVariable: boolean;
  hasSubExpr: boolean;
  expand: boolean;
  stopBackslash: boolean;
  source: string;
  sourceLocation: number;
}
