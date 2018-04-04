import { existsSync, mkdirSync, PathLike, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, sep } from "path";
// tslint:disable-next-line:no-var-requires
const glob = require("glob-fs")({ gitignore: true });

const isDirectory = (path: PathLike) => statSync(path).isDirectory();
const ignoreNodeModule = (path: string) => path.indexOf("node_modules") < 0;
const ignoreDotDir = (path: string) => path.startsWith(".") === false;
const ignoreBuildDir = (path: string) => path.startsWith("build") === false;
const getDirectoriesIn = (path: PathLike): string[] => {
    return readdirSync(path)
      .map((name) => join(path.toString(), name))
      .filter(isDirectory)
      .filter(ignoreNodeModule)
      .filter(ignoreDotDir)
      .filter(ignoreBuildDir);
};
const isFile = (path: PathLike) => statSync(path).isFile();

const defaultFileFilter = () => true;

const getFilesInDirectory = (path: PathLike, fileFilter?: (path: string) => boolean) =>
      readdirSync(path)
      .map((name) => join(path.toString(), name))
      .filter(isFile)
      .filter(fileFilter || defaultFileFilter );

const getDirectoriesRecursivelyIn = (path: string): string[] => {
  const subDirs = getDirectoriesIn(path);
  const result: string[] = [...subDirs];
  subDirs.map((dir) => {
    result.push(...getDirectoriesRecursivelyIn(dir));
  });

  return result;
};

export const getFilesRecursivelyIn = (directoryPath: string, fileFilter?: (path: string) => boolean): string[] => {
  const dirs = getDirectoriesRecursivelyIn(directoryPath);
  const files = dirs
      .map((dir) => getFilesInDirectory(dir, fileFilter))
      .reduce((a, b) => a.concat(b), []);
  return files;
};

export const getFilesFromGlob = (globPattern: string): string[] => {
  try {
    const files: string[] = glob.readdirSync(globPattern);
    return files;
  } catch (error) {
    return [];
  }

};

export const writeJsonFileSync = (data: any, ...paths: string[]) => {
  const json = JSON.stringify(data, null, 2);
  const filePath = join(...paths);
  ensureDirectoryStructureExists(filePath);
  writeFileSync(filePath, json);
};

export const readAllLines = (filePath: string): string[] =>  {
  const lines =  readFileSync(filePath, "utf8")
                .split("\n");
  return lines;
};

export const getParentDirs = (filePath: string) => {
  const paths = filePath
    .split(sep)
    .filter((dir) => dir !== ".");

  const dirs = paths.splice(0, paths.length - 1);
  return dirs;
};

export const getFilename = (filePath: string): string | undefined => {
  const filename = filePath
    .split(sep)
    .pop();
  // tslint:disable-next-line:no-console
  console.log(`path:${filePath}, filename:${filename}`);
  return filename;
};

const ensureDirectoryStructureExists = (filePath: string) => {
  const dirs = getParentDirs(filePath);
  let partialPath: string = ".";
  dirs
    .map((dir) => {
      partialPath = [partialPath, dir].join(sep);
      ensureDirectoryExists(partialPath);
    });
};

const ensureDirectoryExists = (directoryPath: string) => {
  if (existsSync(directoryPath)) {
    return;
  }
  mkdirSync(directoryPath);
};

export const jsonFrom = (filePath: string): any => {
  if (!isFile(filePath)) {
    return {};
  }
  return JSON.parse(readFileSync(filePath, "utf8"));
};

export const fileExists = (filePath: string): boolean => {
  if (existsSync(filePath) && isFile(filePath)) {
    return true;
  }

  if (existsSync(filePath) && isDirectory(filePath)) {
    throw new Error(`File '${filePath}' is a directory but should be a file.`);
  }

  return false;
};
