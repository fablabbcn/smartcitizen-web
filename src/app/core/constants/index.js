import angular from 'angular';

import { COUNTRY_CODES } from './countryCodes.constant';
import { DROPDOWN_OPTIONS_COMMUNITY } from './dropdownOptionsCommunity.constant';
import { DROPDOWN_OPTIONS_KIT } from './dropdownOptionsKit.constant';
import { DROPDOWN_OPTIONS_USER } from './dropdownOptionsUser.constant';
import { MARKER_ICONS } from './markerIcons.constant';
import { PROFILE_TOOLS } from './profileTools.constant';


export default angular.module('app.core.constants',[])
.constant('COUNTRY_CODES', COUNTRY_CODES)
.constant('DROPDOWN_OPTIONS_COMMUNITY', DROPDOWN_OPTIONS_COMMUNITY)
.constant('DROPDOWN_OPTIONS_KIT', DROPDOWN_OPTIONS_KIT)
.constant('DROPDOWN_OPTIONS_USER', DROPDOWN_OPTIONS_USER)
.constant('MARKER_ICONS', MARKER_ICONS)
.constant('PROFILE_TOOLS', PROFILE_TOOLS)
.name;
