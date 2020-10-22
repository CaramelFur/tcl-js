# tcl-js

> A native javascript tcl interpreter

[![tcl-js](https://img.shields.io/npm/v/tcl-js.svg?style=flat&color=blue)](https://www.npmjs.com/package/tcl-js)
[![tcl-js](https://img.shields.io/npm/dm/tcl-js.svg?color=blue)](https://www.npmjs.com/package/tcl-js)
[![Build Status](https://travis-ci.org/rubikscraft/tcl-js.svg?branch=master&style=flat)](https://travis-ci.org/rubikscraft/tcl-js)
[![codecov](https://codecov.io/gh/rubikscraft/tcl-js/branch/master/graph/badge.svg)](https://codecov.io/gh/rubikscraft/tcl-js)
[![install size](https://packagephobia.now.sh/badge?p=tcl-js&style=flat)](https://packagephobia.now.sh/result?p=tcl-js)

## This is the rewrite branch, this is not functional yet

## About

tcl-js is an interpreter for TCL written in typescript, it tries to replicate the tcl-sh interpreter as closely as possible. If there are any deviations from the original interpeter, they will be listed below. This interpreter is not built for speed or efficiency, but for security, ease of use and modularity. This also means that every part of the interpreter will be documented as accurately as possible.

### Why

I'm aware that there are already packages for NodeJS that link the tcl-sh interpreter directly into NodeJs. The reason this project was started was because of security concerns about this method. Because, if you directly give users access to a system level interpreter, you grant them the ability to execute possibly dangerous commands. An example might be deleting all files it has access to.
With tcl-js you can easily disable unwanted commands and be absolutely sure that they are never executed. It's also a lot easier to insert already existing javascript functions into the interpreter for your specific needs.

### Disclaimer

This project is still a work in progress.

## Getting started

Install tcl-js to your project with

```bash
npm install --save tcl-js
```

or

```bash
yarn add tcl-js
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

Currently none

### Currently working tcl commands

Currently none

### Partially working commands

Currently none

### Other working parts

These are not commands but just general parts of the program. If they are listed here, they work.

- lexer
- parser
