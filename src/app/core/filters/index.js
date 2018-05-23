import angular from 'angular';

import filterLabel from './filterLabel.filter';

export default angular.module('app.core.filters',[])
.filter('filterLabel', filterLabel)
.name;
