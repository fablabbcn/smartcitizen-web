import angular from 'angular';

import loginController from './login.controller';

import login from './login.directive';

export default angular.module('login',[])
.directive('login', login)
.controller('loginController', loginController)
.name;
