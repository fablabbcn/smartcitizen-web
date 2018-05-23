import angular from 'angular';

import loginController from './login.controller';

import login from './login.directive';

export default angular.module('app.component.login',[])
.directive('login', login)
.controller('loginController', loginController)
.name;
