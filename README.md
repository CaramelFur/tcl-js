# tcl-js

> A native javascript tcl interpreter

[![tcl-js](https://img.shields.io/npm/v/tcl-js.svg?style=flat&color)](https://www.npmjs.com/package/tcl-js)
[![Build Status](https://travis-ci.org/rubikscraft/tcl-js.svg?branch=master&style=flat)](https://travis-ci.org/rubikscraft/tcl-js)
[![codecov](https://codecov.io/gh/rubikscraft/tcl-js/branch/master/graph/badge.svg)](https://codecov.io/gh/rubikscraft/tcl-js)
[![install size](https://packagephobia.now.sh/badge?p=tcl-js&style=flat)](https://packagephobia.now.sh/result?p=tcl-js)

## Important

I can not guarantee that everything works as it should, and the api will probably still change.
Therefore it is not recommended use this package in production yet.

But it would be highly appreciated if this package was heavily tested, cause it is impossible for me to test every scenario.

## Getting started

You can easily start using the interpreter with this example

```js
// Import the interpreter
const { Tcl } = require('tcl-js');

// Create a new interpreter
// Every interpreter keeps it scope until destroyed
let tcl = new Tcl();

// The interpreter works async, so an async function is used
async function main(){
  // Print "Hello World!" to the terminal
  tcl.run('set w "World!"');
  tcl.run('puts "Hello $w"')
}

// Call the async function
main();
```

## Documentation

You can find the documentation [here](https://htmlpreview.github.io/?https://github.com/rubikscraft/tcl-js/blob/master/docs/index.html)

## Status

### Currently working tcl commands

These commands should be fully working according to the tcl wiki

- eval
- expr
- lindex
- list
- proc
- puts
- set
- unset

### Partially working commands

Only part of these commands are finished and may not work as expected

- info

### Other working parts

These are not commands but just general parts of the interpreter, if they are listed they work

- lexer
- parser
- command handler
- object and array variables
- list variables
- custom functions
- scoping
- interpreter
