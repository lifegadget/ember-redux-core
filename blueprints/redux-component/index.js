/*jshint esversion:6, node:true*/
const fs          = require('fs');
const path        = require('path');
const chalk       = require('chalk');
const tools       = require('../redux-file-utils');

module.exports = {

  description: 'Shortcut method of adding a component which uses redux for state management.',

  fileMapTokens: function(options) {
    return {
      __root__: tools.rootToken(this),
      __app__: tools.appToken(this),
      __redux__: tools.reduxToken(this)
    };
  },

};
