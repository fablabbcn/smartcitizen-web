import angular from 'angular';

import storeController from './store.controller';

import store from './store.directive';

export default angular.module('app.component.store',[])
.directive('store', store)
.controller('storeController', storeController)
.name;
