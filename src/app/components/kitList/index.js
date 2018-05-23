import angular from 'angular';

import kitList from './kitList.directive';

export default angular.module('app.component.kitList',[])
.directive('kitList', kitList)
.name;
