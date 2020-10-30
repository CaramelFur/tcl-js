const bakedEscapeChars: {
  [index: string]: number;
} = {
  a: 0x7,
  b: 0x8,
  f: 0xc,
  n: 0xa,
  r: 0xd,
  t: 0x9,
  v: 0xb,
};

const bakedEscapeCharsList = Object.keys(bakedEscapeChars);

export function ReplaceEscapeChar(char: string): string {
  if (bakedEscapeCharsList.indexOf(char) >= 0) {
    return String.fromCharCode(bakedEscapeChars[char]);
  }
  return char;
}
