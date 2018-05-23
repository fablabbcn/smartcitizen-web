import angular from 'angular';

import signupController from './signup.controller';

import signup from './signup.directive';

export default angular.module('app.component.signup',[])
.directive('signup', signup)
.controller('signupController', signupController)
.name;
