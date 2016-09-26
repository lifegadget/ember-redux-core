/**
 * Derived from the Ember `mut` helper; this helper serves a similar function
 * but sets values as normal JS values, not Ember objects.
 */
import { assert } from 'ember-metal/debug';
import  symbol from 'ember-metal/symbol';
import ProxyStream from '../streams/proxy-stream';
import BasicStream from '../streams/stream';
import { isStream } from '../streams/utils';
import { MUTABLE_CELL } from 'ember-views/compat/attrs-proxy';
import { INVOKE, ACTION } from 'ember-htmlbars/keywords/closure-action';

export let MUTABLE_REFERENCE = symbol('MUTABLE_REFERENCE');

let MutStream = ProxyStream.extend({
  init(stream) {
    this.label = `(mut ${stream.label})`;
    this.path = stream.path;
    this.sourceDep = this.addMutableDependency(stream);
    this[MUTABLE_REFERENCE] = true;
  },

  cell() {
    let source = this;
    let value = source.value();

    if (value && value[ACTION]) {
      return value;
    }

    let val = {
      value,
      update(val) {
        source.setValue(val);
      }
    };

    val[MUTABLE_CELL] = true;
    return val;
  },
  [INVOKE](val) {
    this.setValue(val);
  }
});


export default function mut(morph, env, scope, originalParams, hash, template, inverse) {
  // If `morph` is `null` the keyword is being invoked as a subexpression.
  if (morph === null) {
    var valueStream = originalParams[0];
    return mutParam(env.hooks.getValue, valueStream);
  }

  return true;
}

export function privateMut(morph, env, scope, originalParams, hash, template, inverse) {
  // If `morph` is `null` the keyword is being invoked as a subexpression.
  if (morph === null) {
    var valueStream = originalParams[0];
    return mutParam(env.hooks.getValue, valueStream, true);
  }

  return true;
}

let LiteralStream = BasicStream.extend({
  init(literal) {
    this.literal = literal;
    this.label = `(literal ${literal})`;
  },

  compute() {
    return this.literal;
  },

  setValue(val) {
    this.literal = val;
    this.notify();
  }
});

function mutParam(read, stream, internal) {
  if (internal) {
    if (!isStream(stream)) {
      let literal = stream;
      stream = new LiteralStream(literal);
    }
  } else {
    assert('You can only pass a path to mut', isStream(stream));
  }

  if (stream[MUTABLE_REFERENCE]) {
    return stream;
  }

  return new MutStream(stream);
}
