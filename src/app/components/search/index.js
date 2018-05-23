import angular from 'angular';

import searchController from './search.controller';

import search from './search.directive';

export default angular.module('app.component.search',[])
.directive('search', search)
.controller('searchController', searchController)
.name;
