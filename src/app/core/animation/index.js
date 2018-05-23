import angular from 'angular';

import backdrop from './backdrop';

import activeButton from './activeButton.directive';
import disableScroll from './disableScroll.directive';
import hidePopup from './hidePopup.directive';
import horizontalScroll from './horizontalScroll.directive';
import moveFilters from './moveFilters.directive';
import showPopup from './showPopup.directive';
import showPopupInfo from './showPopupInfo.directive';
import slide from './slide.directive';
import {
  moveDown,
  stick,
  blur,
  focus,
  changeMapHeight,
  changeContentMargin,
  focusInput
} from './animation.directive';

import layout from './layout.service';
import animation from './animation.service';

export default angular.module('animation',[backdrop])
.directive('activeButton', activeButton)
.directive('animation', animation)
.directive('disableScroll', disableScroll)
.directive('hidePopup', hidePopup)
.directive('horizontalScroll', horizontalScroll)
.directive('moveFilters', moveFilters)
.directive('showPopup', showPopup)
.directive('showPopupInfo', showPopupInfo)
.directive('slide', slide)
.directive('moveDown', moveDown)
.directive('stick', stick)
.directive('blur', blur)
.directive('focus', focus)
.directive('changeMapHeight', changeMapHeight)
.directive('changeContentMargin', changeContentMargin)
.directive('focusInput', focusInput)

.factory('layout', layout)
.factory('animation', animation)
.name;
