import angular from 'angular';

import cookiesLaw from './cookiesLaw.directive';

export default angular.module('cookiesLaw',[])
.directive('cookiesLaw', cookiesLaw)
.name;
