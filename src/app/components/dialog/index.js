import angular from 'angular';

import loginDialogController from './loginDialog.controller';
import mapFilterDialogController from './mapFilterDialog.controller';
import mapTagDialogController from './mapTagDialog.controller';
import passwordRecoveryDialogController from './passwordRecoveryDialog.controller';
import passwordResetDialogController from './passwordResetDialog.controller';
import signupDialogController from './signupDialog.controller';
import storeDialogController from './storeDialog.controller';

export default angular.module('dialog',[])
.controller('loginDialogController', loginDialogController)
.controller('mapFilterDialogController', mapFilterDialogController)
.controller('mapTagDialogController', mapTagDialogController)
.controller('passwordRecoveryDialogController', passwordRecoveryDialogController)
.controller('passwordResetDialogController', passwordResetDialogController)
.controller('signupDialogController', signupDialogController)
.controller('storeDialogController', storeDialogController)
.name;
