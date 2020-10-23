import { Console } from 'console';
import * as fs from 'fs';
import * as path from 'path';
import * as pegjs from 'pegjs';
// @ts-ignore
import * as tspegjs from 'ts-pegjs';

const pegjsExtension = 'pegjs';
const parsersPath = path.join(__dirname, './source');
const outputPath = path.join(__dirname, './parsers');

// Get a list of all parsers to compile
const parsers = fs
  .readdirSync(parsersPath)
  .filter((file) => file.endsWith(`.${pegjsExtension}`));

// Sequentially compile every parser
for (let parser of parsers) {
  console.log('Generating', parser);

  const extensionLessFilename = parser.split('.').slice(0, -1).join('.');
  const outputFilePath = path.join(outputPath, extensionLessFilename + '.ts');
  const pegjsFilePath = path.join(parsersPath, parser);
  const pegjsFile = fs.readFileSync(pegjsFilePath, 'utf-8');

  const fullPegjsFile = appendImports(pegjsFile, pegjsFilePath);

  let parserFile = '';
  try {
    parserFile = pegjs.generate(fullPegjsFile, {
      output: 'source',
      format: 'commonjs',
      plugins: [tspegjs],
    });
  } catch (e) {
    throw new Error('Error at: ' + pegjsFilePath + ' : ' + e.message);
  }

  fs.writeFileSync(outputFilePath, parserFile);

  console.log('  Successfully generated', parser);
}

console.log('Successfully generated all parsers\n');

function appendImports(
  pegjsFile: string,
  pegjsFilePath: string,
  depth = 1,
): string {
  const processedPegjsFile = pegjsFile.replace(
    /^\/\/import "(.*)"$/gm,
    (match: string, importpath: string) => {
      const pegjsFileDirPath = path.dirname(pegjsFilePath);
      const importFilePath = path.join(
        pegjsFileDirPath,
        importpath + '.' + pegjsExtension,
      );

      const importFileName = path.basename(importFilePath);
      console.log(' '.repeat(depth * 2) + '└───Importing', importFileName);

      let importFile = '';
      try {
        importFile = fs.readFileSync(importFilePath, 'utf-8');
      } catch (e) {
        console.log('Could not find', importFilePath);
      }

      const fullImportFile = appendImports(
        importFile,
        importFilePath,
        depth + 1,
      );

      return fullImportFile + '\n';
    },
  );

  return processedPegjsFile;
}
