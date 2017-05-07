import Immutable from 'npm:immutable';
import StateCache from './redux-state-cache';

const cache = new StateCache();

export default function watch(getState) {
  let oldValue = Immutable.Map(getState());
  return function w (fn) {
    return function () {
      const newValue = Immutable.Map(getState());
      if (Immutable.Iterable.isIterable(newValue)) {
        const newCode = newValue.hashCode();
        const oldCode = cache.get('root') || 0;
        if (newCode !== oldCode) {
          cache.add('root', newCode);
          fn(newValue, oldValue);
        }
      } else {
        console.warn('Redux: the watch() method was passed a non-iterable value; this shouldn\'t happen.');
      }
    };
  };
}
