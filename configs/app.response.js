import currentDateTime from '../lib/current.date.time.js';

/**
 * Function to provide a formatted success response for all APIs
 * @param {Number} resultCode API response defined custom result_code
 * @param {String} title API response title based on result_code
 * @param {String} message API response your defined message
 * @param {*} data Send any kind of data in API response
 * @param {*} maintenance API provide any kind of maintenance information
 * @returns success response return for all API's
 */
export const successResponse = (resultCode, title, message, data, maintenance) => ({
  result_code: resultCode,
  time: currentDateTime(),
  maintenance_info: maintenance || null,
  result: {
    title, message, data
  }
});

/**
 * Function to provide a formatted error response for all APIs
 * @param {Number} resultCode API response defined custom result_code
 * @param {String} title API response title based on result_code
 * @param {*} error Send any kind or error in API response
 * @param {*} maintenance API provide any kind of maintenance information
 * @returns error response return for all API's
 */
export const errorResponse = (resultCode, title, error, maintenance) => ({
  result_code: resultCode,
  time: currentDateTime(),
  maintenance_info: maintenance || null,
  result: {
    title, error
  }
});
