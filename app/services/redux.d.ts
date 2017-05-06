import Ember from 'ember';
import reduxStore from '../redux/storeConfig';
import initialState from '../redux/state-initializers/index';
import actionCreators from '../redux/actions/index';
import watch from '../utils/watch';
import * as Immutable from 'npm:immutable';

export interface IDictionary<T>{
  [name: string]: T;
}

export interface IAction extends IDictionary<any> {
  type: string;
}

export interface redux extends Ember.Service {
  dispatchActionCreator(ac: string, ...params): IDictionary<string>;
} 
