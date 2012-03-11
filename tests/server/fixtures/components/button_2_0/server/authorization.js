"use strict";

/**
 * The dynamic condition for the component.
 *
 * @param {Object} securityContext the security context
 * @returns {Boolean} true if user is allowed to access the component or false otherwise
 */
function _component(securityContext) {
    return securityContext.user.country === 'US';
}

/**
 * The dynamic condition for the index view.
 *
 * @param securityContext the security context
 * @returns {Boolean} true if user is allowed to access the view or false otherwise
 */
function index(securityContext) {
    return securityContext.user.language === 'en_US';
}

/**
 * The dynamic condition for the buttons view.
 *
 * @param securityContext the security context
 * @returns {Boolean} true if user is allowed to access the view or false otherwise
 */
function buttons(securityContext) {
    return true;
}

module.exports = {
    _component: _component,
    index: index,
    buttons: buttons
};
