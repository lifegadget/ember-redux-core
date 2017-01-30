const path        = require('path');
const tools       = require('../redux-file-utils');

module.exports = {
  description: 'Installation blueprint for ember-redux-core',
  normalizeEntityName: function() {},

  afterInstall: function() {
    return this.addAddonsToProject({
      packages: [
        {name: 'ember-browserify', target: '^1.1.11'},
      ]
    }).then(function() {
      return this.addPackagesToProject([
        {name: 'redux', target: '^3.6.0'},
        {name: 'immutable', target: '^3.8.1'}
      ]);
    }.bind(this));
  },

 fileMapTokens: function(options) {
    return {
      __root__: tools.rootToken(this),
      __app__: tools.appToken(this),
      __redux__: tools.reduxToken(this)
    };
  },

};
