import Ember from 'ember';
const  _services = {};

export default class Services {

  constructor(name = null, service = null) {
    if (name && service) {
      this.add(name, service);
    }
  }

  add(name, service) {
    if(_services[name]) {
      console.warn(`Adding the Redux service "${name}" but it already exists; will override.`);
    }

    if(!service) {
      throw new Error(`An empty service definition was passed in for "${name}"`);
    }

    _services[name] = service;
  }

  get(name) {
    if(!_services[name]) {
      throw new Error(`Redux service "${name}" is not present in registry.`);
    }

    return _services[name];
  }

  list() {
    return Object.keys(_services);
  }
}
