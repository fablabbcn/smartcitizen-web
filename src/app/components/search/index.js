import angular from 'angular';

import searchController from './search.controller';

import search from './search.directive';

export default angular.module('search',[])
.directive('search', search)
.controller('searchController', searchController)
.name;
