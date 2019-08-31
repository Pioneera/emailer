"use strict";
const nodeMailer = require('nodemailer');
const debug = require("debug")("pioneera-email:nodemailer");

module.exports = function(msg, config) {
  return new Promise(function(resolve, reject) {
    if (!(config && config.EMAIL && config.EMAIL.PASSWORD && config.EMAIL.LOGIN && config.EMAIL.HOST)) {
      let configError = new Error('Missing authentication information to send email');
      return reject(configError);
    }

    const transporter = nodeMailer.createTransport({
      auth: {
        pass: config.EMAIL.PASSWORD,
        user: config.EMAIL.LOGIN
      },
      host: config.EMAIL.HOST,
      port: config.EMAIL.PORT || 456,
      secure: true
    });

    transporter.sendMail(msg)
      .then(messageInfo => {
        if(messageInfo && messageInfo.messageId){
          return resolve(messageInfo.messageId);
        } else {
          const mailerError = new Error('Unable to send message');
          mailerError.status = 500;
          mailerError.response = messageInfo;
          return reject(mailerError);
        }
      })
      .catch(err => {
        return reject(err);
      });

  });
};
