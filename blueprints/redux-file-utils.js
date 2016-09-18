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
  const { type, action, options, externalDeps } = config;
  const typeSingular = type.substr(-1);
  const name = options.entity.name;
  const fileContents = loadFile(findFile(type, options));
  const verb = action === 'add' ? 'adding ' : 'removing ';
  const color = action === 'add' ? 'green' : 'red';
  const direction = action === 'add' ? 'to' : 'from';
  const modules = getModules(findDirectory(type, options));
  const dependencies = externalDeps(modules.length);
  const onlyOnce = fileContents.aboveFold.indexOf(dependencies) === -1 ? dependencies : '';

  context.ui.writeLine( `  ${chalk[color](verb)} "${chalk.bold(name)}" ${direction} master ${typeSingular} file [${chalk.grey(`${type}/index.js`)}]`);

  saveMasterFile(
    findFile(type, options),
    onlyOnce + fileContents.aboveFold + generateImports(modules) + generateExports(modules)
  );
};

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

function generateImports(modules) {
  return '\n\n' + modules.map(m => {
    return `import ${m} from './${m}';\n`
  }).join('');
}

function generateExports(modules) {
  const prolog = '\n\nexport default combineReducers({\n';
  const epilog = '\n});';
  const content = modules.map(m => {
    return `  ${m}`;
  }).join(',\n');

  return prolog + content + epilog;
}

module.exports = {
    manage,
    rootToken,
    appToken,
    reduxToken
};
