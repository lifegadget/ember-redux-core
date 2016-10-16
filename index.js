/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-redux-core',
  normalizeEntityName: () => {},
  afterInstall() {
    return this.addAddonToProject('ui-immutable');
  }
};
