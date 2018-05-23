import angular from 'angular';

import loadingBackdrop from './loadingBackdrop.directive';
import noDataBackdrop from './noDataBackdrop.directive';

export default angular.module('app.core.backdrop',[])
.directive('loadingBackdrop', loadingBackdrop)
.directive('noDataBackdrop', noDataBackdrop)
.name;
