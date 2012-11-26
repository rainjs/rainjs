"use strict";

/**
 * Resolves the GET HTTP verb.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function doGet(request, response) {}

/**
 * Resolves the POST HTTP verb.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function doPost(request, response) {}

/**
 * Resolves the DELETE HTTP verb.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function doDelete(request, response) {}

/**
 * Resolves the PUT HTTP verb.
 *
 * @param {Request} request the request object
 * @param {Response} response the response object
 */
function doPut(request, response) {}

module.exports = {
    'get': doGet,
    'post': doPost,
    'delete': doDelete,
    'put': doPut
};
