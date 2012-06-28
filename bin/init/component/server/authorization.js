"use strict";

/**
 * The dynamic condition for the component.
 *
 * @param {Object} securityContext the security context
 * @returns {Boolean} true if user is allowed to access the component
 */
function _component(securityContext) {
    return true;
}

/**
 * The dynamic condition for the 'index' view.
 *
 * @param securityContext the security context
 * @returns {Boolean} true if user is allowed to access the view
 */
function index(securityContext) {
    return true;
}

/**
 * @example
 * module.exports = {
 *     _component: _component,
 *     index: index
 * };
 */
module.exports = {};
