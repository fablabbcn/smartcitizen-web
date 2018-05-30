import angular from 'angular';

import betaController from './beta.controller';

import beta from './beta.directive';

export default angular.module('app.component.beta',[])
.directive('beta', beta)
.controller('betaController', betaController)
.name;