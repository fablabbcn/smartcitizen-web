import angular from 'angular';

import passwordResetController from './passwordReset.controller';

export default angular.module('passwordReset',[])
.controller('passwordResetController', passwordResetController)
.name;
