import Ember from 'ember';
const cache = {};

export default class StateCache {
  get(path) {
    return cache[path];
  }

  add(path, value) {
    cache[path] = value;
  }

  bulkAdd(updates) {
    updates.forEach(update => this.add(update.path, update.value));
  }

  list() {
    return Ember.assign({}, cache);
  }
}