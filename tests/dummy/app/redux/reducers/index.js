import Ember from 'ember';
/**
 * This is the master reducer, it partitions the jobs amounts
 * one or more other reducers which take on responsibility for
 * a discrete part of the state tree.
 *
 * Use the "ember generate reducer [name]" command to create additional
 * reducers (and "ember destroy" to remove).
 *
 * Alternatively, if you have a very simple state model, you can just use
 * this file as the single reducer used by the store.
 *
 * Note: only VERY small applications should be managed by a single
 * reducer file.
 */

Ember.debug('You are using the main reducer in ember-redux-core; this is probably unintentional. In most cases running "ember generate ember-redux-core" should restore the main reducer in your app\'s redux/reducers folder');

export default (store, action) => store;
