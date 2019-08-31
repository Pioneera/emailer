"use strict";
const sgMail = require('@sendgrid/mail');
const debug = require("debug")("pioneera-email:sendgrid");

module.exports = function(msg, config) {
  return new Promise(function(resolve, reject) {
    sgMail
      .send(msg)
      .then(msgResponse => {
        if (msgResponse && Array.isArray(msgResponse) && msgResponse.length > 1 && msgResponse[0].hasOwnProperty('statusCode') && msgResponse[0].hasOwnProperty('headers') && msgResponse[0].headers.hasOwnProperty('x-message-id') && msgResponse[0].statusCode == 202) {
          return resolve(msgResponse[0]['headers']['x-message-id']);
        } else {
          const mailerError = new Error('Unable to send message');
          mailerError.status = 500;
          mailerError.response = msgResponse
          return reject(mailerError)
        }
      })
      .catch(error => {
        return reject(error);
        // //Log friendly error
        // console.error(error.toString());
        //
        // //Extract error msg
        // const {message, code, response} = error;
        //
        // //Extract response msg
        // const {headers, body} = response;
      });
  })
}
