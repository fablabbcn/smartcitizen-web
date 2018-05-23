import angular from 'angular';

import SearchResult from './searchResult.constructor';
import SearchResultLocation from './searchResultLocation.constructor';

export default angular.module('app.core.searchResult',[])
.factory('SearchResult', SearchResult)
.factory('SearchResultLocation', SearchResultLocation)
.name;
