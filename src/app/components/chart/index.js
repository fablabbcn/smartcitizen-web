import angular from 'angular';

import chart from './chart.directive';

export default angular.module('app.component.chart',[])
.directive('chart', chart)
.name;
