import angular from 'angular';

import kitList from './kitList.directive';

export default angular.module('kitList',[])
.directive('kitList', kitList)
.name;
