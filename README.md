# tcl-js

> A native javascript tcl interpreter

[![tcl-js](https://img.shields.io/npm/v/tcl-js.svg?style=flat&color=blue)](https://www.npmjs.com/package/tcl-js)
[![tcl-js](https://img.shields.io/npm/dm/tcl-js.svg?color=blue)](https://www.npmjs.com/package/tcl-js)
[![Build Status](https://travis-ci.org/rubikscraft/tcl-js.svg?branch=master&style=flat)](https://travis-ci.org/rubikscraft/tcl-js)
[![codecov](https://codecov.io/gh/rubikscraft/tcl-js/branch/master/graph/badge.svg)](https://codecov.io/gh/rubikscraft/tcl-js)
[![install size](https://packagephobia.now.sh/badge?p=tcl-js&style=flat)](https://packagephobia.now.sh/result?p=tcl-js)

## About

tcl-js is an interpreter for TCL written in typescript, it tries to replicate the tcl-sh interpreter as closely as possible. If there are any deviations from the original interpeter, they will be listed below. This interpreter is not built for speed or efficiency, but for security, ease of use and modularity. This also means that every part of the interpreter will be documented as precisely as possible.

### Why

I am aware that there already exist packages for NodeJS that link the tcl-sh interpreter directly into node. The reason this project was started was because of security concerns about this method. Because, if you directly give users access to a system level interpreter, you grant them the ability to execute possible dangerous commands. An example might be deleting all files the nodejs process has permissions over.
With tcl-js you can easily disable unwanted commands and be absolutely sure that they are never executed. It is also a lot easier to insert already existing javascript functions into the interpreter for your specific needs.

### Disclaimer

This project is still a work in progress.
While it is unlikely, the api or the way certain things are handled might change in the future.

If you would like to make this project hit a producion fase earlier, you are welcome to submit a pull request.

## Getting started

Install tcl-js to your project with

```bash
npm install --save tcl-js
```

Then use it in your project by importing the Tcl component.

```js
// Import the interpreter
const { Tcl } = require('tcl-js');

// Create a new interpreter
// Every interpreter will keep its scope until it is destroyed
let tcl = new Tcl();

// The interpreter works asynchronous, so an async function is used
// Using promises will also work here
async function main() {
  // Print "Hello World!" to the terminal
  await tcl.run('set w "World!"');
  await tcl.run('puts "Hello $w"');

  // Use this to run a file:
  // await tcl.runFile('~/tcl/demo.tcl');
}

// Call the async function
main().catch(console.error);
```

## Documentation

You can find all the documentation [here](https://htmlpreview.github.io/?https://raw.githubusercontent.com/rubikscraft/tcl-js/master/docs/classes/_tcl_.tcl.html).

## Status

Down below is the current project status of tcl-js, here you can see what parts are already implemented and working. Any deviations that have been made from the original tcl-sh interpreter will also be listed here.

### Deviations

- In the `expr` command:
  - The `in` operator is unavailable
  - Numbers with leading zeros are just interpreted as decimal and not octal

### Currently working tcl commands

These commands should be fully working as documented in the tcl wiki.

- break
- continue
- eval
- expr
- for
- if
- incr
- lindex
- list
- proc
- puts
- set
- switch
- unset
- while

### Partially working commands

Only part of these commands are finished and they may not work as expected.

- info

### Other working parts

These are not commands but just general parts of the program. If they are listed here, they work.

- lexer
- parser
- command handler
- object and array variables
- list variables
- custom functions
- scoping
- interpreter
- backslash escape sequences
- advanced variables
- asynchronous
- expression variables
- looping
- exiting recursive loops
- external javascript functions
- external javascript variables
- argument expansion
