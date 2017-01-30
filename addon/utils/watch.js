import Ember from 'ember';
const { get } = Ember;

function defaultCompare (a, b) {
  return a === b;
}

export default function watch(getState, objectPath, compare) {
  compare = compare || defaultCompare;
  let currentValue = objectPath === '.' ? getState() : get(getState(), objectPath);
  return function w (fn) {
    return function () {
      const newValue = get(getState(), objectPath);
      if (!compare(currentValue, newValue)) {
        const oldValue = currentValue;
        currentValue = newValue;
        fn(newValue, oldValue, objectPath);
      }
    };
  };
}
