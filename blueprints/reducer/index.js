/*jshint esversion:6, node:true*/
const fs          = require('fs');
const path        = require('path');
const chalk       = require('chalk');
const tools       = require('../redux-file-utils');

module.exports = {

  description: 'Manages the reducer files for Redux.',

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
    type: 'reducers',
    wrapperFunction: 'combineReducers',
    isArray: false, // either array or hash structure
    propertyPassedToValue: false,
    externalDeps: (count) => {
      return count > 0
        ? `import redux from 'npm:redux';\nconst { combineReducers } = redux;\n`
        : '';
    },
    action, // aka, 'add' or 'remove'
    options,
  });
}
