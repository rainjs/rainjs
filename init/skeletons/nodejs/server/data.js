/**
 * Handles the template data for the view index and returns it with invoking the callback function
 *
 * @param callback The callback function which must be invoked if the data is completely build
 * @param data Data of the parent template for special usage
 */
function index(callback, data) {
    var error = null;
    var customData = null;
    
    callback(error, customData);
}

module.exports = {
    index: index
};
