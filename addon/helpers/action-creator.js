import Ember from 'ember';
const { Helper, typeOf, get, assert } = Ember;

export default Helper.extend({
  redux: Ember.inject.service(),

  compute(params, hash) {
    return (evt) => {
      const [ fn, ...rest ] = params;
      const ac = get(this, 'redux')._actionCreators;
      assert(`[ember-redux-core] Action creator must be passed a string of format [module.function]; was passed a "${typeof(fn)}" instead`, typeOf(fn) === 'string');
      const [ module, func ] = fn.split('.');
      assert(`[ember-redux-core] Action creator failed because the module "${module}" is unknown [${fn}]`, get(ac, module));
      assert(`[ember-redux-core] Action creator in module "${module}" does not have function "${func}"`, get(ac, fn));
      const actionCreator = get(ac, fn);

      return this.get('redux').dispatch( rest.length > 0 ? actionCreator(...rest, hash): actionCreator(hash) );
    };

  }
});
