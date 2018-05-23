import angular from 'angular';

import signupController from './signup.controller';

import signup from './signup.directive';

export default angular.module('signup',[])
.directive('signup', signup)
.controller('signupController', signupController)
.name;
