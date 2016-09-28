import Ember from 'ember';
const htmlSafe = Ember.String.htmlSafe;

export function placeholder(params/*, hash*/) {
  const [ intendedValue, placeholderText ] = params;
  return intendedValue ? intendedValue : htmlSafe(`<span class="placeholder">${placeholderText}</span>`);
}

export default Ember.Helper.helper(placeholder);
