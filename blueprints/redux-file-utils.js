/*jshint esversion:6, node:true*/
'use strict';
const fs          = require('fs');
const path        = require('path');
const chalk       = require('chalk');


// distinguishes between an ADDON and APP's root
// directory
const rootToken = function rootToken(context) {
  return (options) => pathAddonVersusApp(context, options.inAddon);
};

const appToken = function appToken(context) {
  return (options) => path.join(pathAddonVersusApp(context, options.inAddon), 'app');
};

const reduxToken = function reduxToken(context) {
  return (options) => path.join(pathAddonVersusApp(context, options.inAddon), 'app', 'redux');
};

function pathAddonVersusApp(context, isAddon) {
  if (!!context.project.config()['ember-redux'] && !!context.project.config()['ember-redux'].directory) {
      return context.project.config()['ember-redux'].directory;
    } else if (isAddon) {
      return path.join('tests', 'dummy');
    } else {
      return '/';
    }
}

const manage = function manage(context, config) {
  const { type, action, options, externalDeps, wrapperFunction, isArray, propertyPassedToValue, outputModuleList, useNamedInputs, inClosing } = config;
  const singularNames = {
    reducers: 'Reducer',
    middleware: 'Middleware',
    ['static-initializers']: 'Static Initializer'
  };
  const typeSingular = singularNames[type];
  const name = options.entity.name;
  const fileContents = loadFile(findFile(type, options));
  const verb = action === 'add' ? 'adding ' : 'removing ';
  const color = action === 'add' ? 'green' : 'red';
  const direction = action === 'add' ? 'to' : 'from';
  const modules = getModules(findDirectory(type, options));
  const modulesListOutput = outputModuleList ? buildModulesList(modules) : '';
  const dependencies = externalDeps(modules.length);
  const onlyOnce = fileContents.aboveFold.indexOf(dependencies) === -1 ? dependencies : '';

  context.ui.writeLine( `  ${chalk[color](verb)} "${chalk.bold(name)}" ${direction} master ${typeSingular} file [${chalk.grey(`${type}/index.js`)}]`);

  saveMasterFile(
    findFile(type, options),
    (
      onlyOnce +
      fileContents.aboveFold +
      generateImports(modules, useNamedInputs) +
      modulesListOutput +
      generateExports(modules, config) +
      inClosing ? inClosing : ''
    )
  );
};

function buildModulesList(modules) {
  const prolog = 'const modules = [\n';
  const epilog = '];';
  const body = modules.join(',\n');

  return prolog + body + epilog;
}

function getPathParts(type, options) {
  let pathParts = [options.project.root];

  if (options.dummy && options.project.isEmberCLIAddon()) {
    pathParts = pathParts.concat(['tests', 'dummy', 'app', 'redux', type]);
  } else {
    pathParts = pathParts.concat(['app', 'redux', type]);
  }

  return pathParts;
}

function findFile(type, options) {
  return path.join(...getPathParts(type, options).concat(['index.js']));
}

function findDirectory(type, options) {
  return path.join(...getPathParts(type, options));
}

function getModules(directory) {
  return fs.readdirSync(directory, 'utf8').filter( f => f !== 'index.js' ).map( f => f.replace('.js', ''));
}

function saveMasterFile(fileName, content) {
  fs.writeFileSync(fileName, content, { encoding: 'utf8'});
}

function loadFile(fileName) {
  const contents = fs.readFileSync(fileName, 'utf-8');
  if(contents.indexOf(' */') === -1) {
    return {
      aboveFold: '',
      belowFold: contents
    };
  } else {
    return {
      aboveFold: contents.split(' */')[0] + ' */',
      belowFold: contents.split(' */')[1]
    };
  }
}

function generateImports(modules, useNamedInputs) {
  const prolog = '\n\n';
  const body = useNamedInputs ? modules.map(m=>`import * as ${m} from './${m}';\n`) : modules.map(m=>`import ${m} from './${m}';\n`);

  return prolog + body.join('');
}

function generateExports(modules, config) {
  let { wrapperFunction, isArray, propertyPassedToValue } = config;
  const blockStart = isArray ? '[' : '{';
  const blockEnd = isArray ? ']' : '}';
  wrapperFunction = wrapperFunction ? wrapperFunction + '(' : '';
  const prolog = `\nexport default ${wrapperFunction}${blockStart}\n`;
  const epilog = `\n${blockEnd}${wrapperFunction ? ')' : ''};`;
  const content = modules.map(m => {
    const moduleDef = propertyPassedToValue
      ? `  ${m}: ${m}(${propertyPassedToValue})`
      : `  ${m}`;
    return moduleDef;
  }).join(',\n');

  return prolog + content + epilog;
}

module.exports = {
    manage,
    rootToken,
    appToken,
    reduxToken,
    findDirectory
};
