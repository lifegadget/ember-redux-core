/*jshint esversion:6, node:true*/
const fs          = require('fs');
const path        = require('path');
const chalk       = require('chalk');
const tools       = require('../redux-file-utils');

module.exports = {

  description: 'Manages the middleware modules used in the Redux store.',

  fileMapTokens: function(options) {
    return {
      __root__: tools.rootToken(this),
      __app__: tools.appToken(this),
      __redux__: tools.reduxToken(this)
    };
  },

  afterInstall: function(options) {
    handler.call(this, 'add', options);
  },

  afterUninstall: function(options) {
    handler.call(this, 'remove', options);
  }

};

function handler(action, options) {
  const moduleName = options.entity.name;
  const applicationName = options.project.pkg.name;

  switch(action) {
    case 'add':
      console.log(chalk.bold('\nAction supporter created') + ', to import into a container add:');
      console.log(chalk.grey('\n  import ') +
        chalk.green(moduleName) +
        chalk.grey(' from ') +
        chalk.white(`'/${applicationName}/redux/actions/`) +
        chalk.white.bold(moduleName + '\'') +
        chalk.grey(';')
      );
      console.log();
      return;
    case 'remove':

  }

}
