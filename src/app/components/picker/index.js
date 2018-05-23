import angular from 'angular';

import picker from './picker.directive';

export default angular.module('app.component.picker',[])
.directive('picker', picker)
.name;
