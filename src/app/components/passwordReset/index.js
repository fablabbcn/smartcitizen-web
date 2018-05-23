import angular from 'angular';

import passwordResetController from './passwordReset.controller';

export default angular.module('app.component.passwordReset',[])
.controller('passwordResetController', passwordResetController)
.name;
