import * as fs from 'fs';
import * as path from 'path';

import * as nearleyThere from './nearley-there';

const nearleyExtension = 'ne';
const parsersPath = path.join(__dirname, './source');
const outputPath = path.join(__dirname, './parsers');

// Get a list of all parsers to compile
const parsers = fs
  .readdirSync(parsersPath)
  .filter((file) => file.endsWith(`.${nearleyExtension}`));

// Sequentially compile every parser
for (const parser of parsers) {
  console.log('Generating', parser);

  const extensionLessFilename = parser.split('.').slice(0, -1).join('.');
  const outputFilePath = path.join(outputPath, extensionLessFilename + '.ts');
  const nearleyFilePath = path.join(parsersPath, parser);

  let parserFile = '';
  try {
    parserFile = nearleyThere.compile(nearleyFilePath, nearleyFilePath);
  } catch (e) {
    e.message = 'Error at: ' + nearleyFilePath + ' : ' + e.message;
    throw e;
  }

  fs.writeFileSync(outputFilePath, parserFile);

  console.log('  Successfully generated', extensionLessFilename + '.ts');
}
