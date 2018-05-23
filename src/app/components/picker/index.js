import angular from 'angular';

import picker from './picker.directive';

export default angular.module('picker',[])
.directive('picker', picker)
.name;
