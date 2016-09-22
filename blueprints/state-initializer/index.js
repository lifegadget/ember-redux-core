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
    manage.call(this, 'add', options);
  },

  afterUninstall: function(options) {
    manage.call(this, 'remove', options);
  }

};

function manage(action, options) {
  tools.manage(this, {
    type: 'state-initializers',
    wrapperFunction: null,
    useNamedInputs: true,
    outputModuleList: false,
    isArray: false,
    propertyPassedToValue: false,
    externalDeps: () => ``,
    action,
    options,
    // inClosing: fs.readFileSync(path.join(
    //   options.project.root,
    //   'node_modules/ember-redux-core/blueprints/state-initializer/in-closing-template.js'
    //   ), { encoding: 'utf8'})
  });
}
