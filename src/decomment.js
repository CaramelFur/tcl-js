module.exports = function (str) {
  let out = [];
  let lines = str.split('\n');
  let i;
  for (i = 0; i < lines.length; i++) {
    if (!/^\s*#/.test(lines[i])) {
      out.push(lines[i]);
    }
  }
  return out.join('\n');
};
