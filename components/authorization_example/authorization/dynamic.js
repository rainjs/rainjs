/**
 * The dynamic condition for the component.
 *
 * @param {Object} securityContext the security context
 * @returns {Boolean} true if user is allowed to access the component or false otherwise
 */
function _component(securityContext) {
    return true;
}

/**
 * The dynamic condition for the index view.
 *
 * @param securityContext the security context
 * @returns {Boolean} true if user is allowed to access the view or false otherwise
 */
function index(securityContext) {
    return true;
}

/**
 * The dynamic condition for the index button1.
 *
 * @param securityContext the security context
 * @returns {Boolean} true if user is allowed to access the view or false otherwise
 */
function button1(securityContext) {
    return true;
}

/**
 * The dynamic condition for the index button2.
 *
 * @param securityContext the security context
 * @returns {Boolean} true if user is allowed to access the view or false otherwise
 */
function button2(securityContext) {
    return securityContext.user.location === 'US';
}

module.exports = {
    _component: _component,
    index: index,
    button1: button1,
    button2: button2
};
