"use strict";

/**
 * Utility method to send a error message in case of an error. 
 * 
 * @param {Error} err the error object
 * @param {Request} req the request object
 * @param {Response} res the response object
 */
function handleError(err, req, res) {
    var errorHandler = require('./error_handler');
    var renderer = require('./renderer');    
    var status = err.code || 500;
    var accept = req.headers.accept || '';
    
    if (status < 400) {
        status = 500;
    }
    res.statusCode = status;    
    
    if (accept.indexOf('text/html') !== -1) {
        res.setHeader('Content-Type', 'text/html');
        var conf = errorHandler.getErrorComponent(status);
        if (conf) {
            res.write(renderer.renderBootstrap(conf.component, conf.view, req, res));
        } else {
            res.end();
        }        
    } else {
        res.setHeader('Content-Type', 'text/plain');
        res.end();
    }
}

module.exports = {
    handleError: handleError
};