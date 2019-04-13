let Interp = require("./src/interp.js");
let I = Interp();

I.registerCommand('puts', function(args){
  let out = "";
  args.shift();
  args = args.map(arg => arg.jsval);
  args = args.join(" ");
  console.log(args)
});

I.TclEval('', function(result){
  console.log(result)
});
