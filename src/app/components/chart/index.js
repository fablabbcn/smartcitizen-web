import angular from 'angular';

import chart from './chart.directive';

export default angular.module('chart',[])
.directive('chart', chart)
.name;
