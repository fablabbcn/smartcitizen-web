import angular from 'angular';

import cookiesLaw from './cookiesLaw.directive';

export default angular.module('app.component.cookiesLaw',[])
.directive('cookiesLaw', cookiesLaw)
.name;
