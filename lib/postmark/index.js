"use strict";
const Postmark = require("postmark")
const debug = require("debug")("pioneera-email:postmark");

module.exports = function(msg, config) {
  return new Promise(function(resolve, reject) {
    if (!(config && config.POSTMARK && config.POSTMARK && config.POSTMARK.API_TOKEN)) {
      const notConfigured = new Error('Postmark is not configured. Unable to send');
      return reject(notConfigured);
    }
    const postmark = new Postmark.ServerClient(config.POSTMARK.API_TOKEN);
    let payload = {
      To: msg.to.join(', ')
    };
    if (msg.cc) payload.Cc = msg.cc.join(', ');
    if (msg.bcc) payload.Bcc = msg.bcc.join(', ');
    if (msg.replyTo) payload.ReplyTo = msg.replyTo;
    if (msg.from) payload.From = msg.from;
    if (msg.subject) payload.Subject = msg.subject;
    if (msg.html) payload.HtmlBody = msg.html;
    if (msg.text) payload.TextBody = msg.text;

    payload.TrackOpens = msg.trackOpens;
    if (msg.trackHtmlLinks && msg.trackTextLinks) {
      payload.TrackLinks = 'HtmlAndText';
    } else if (msg.trackHtmlLinks && !msg.trackTextLinks) {
      payload.TrackLinks = 'HtmlOnly';
    } else if (msg.trackTextLinks && !msg.trackHtmlLinks) {
      payload.TrackLinks = 'TextOnly';
    } else {
      payload.TrackLinks = 'None';
    }

    if (msg.metadata) payload.Metadata = msg.metadata;

    if (msg.headers) {
      let headers = [];
      for (let i = 0; i < msg.headers.length; i++) {
        const header = msg.headers[i];
        headers.push({
          Name: header.name,
          Value: header.value
        })
      }
      payload.Headers = headers;
    }

    if (msg.attachments) {
      let attachments = [];
      for (let i = 0; i < msg.attachments.length; i++) {
        const attachment = msg.attachments[i];
        let attachmentData = {
          Name: attachment.name,
          Content: attachment.content,
          ContentType: attachment.contentType
        }
        if (attachment.contentId) attachmentData.ContentID = attachment.contentId
        attachments.push(attachment);
      }
      payload.Attachments = attachments;
    }

    postmark.sendEmail(payload)
      .then(msgResponse => {
        if (msgResponse && msgResponse.MessageID) {
          return resolve(msgResponse.MessageID);
        } else {
          const mailerError = new Error('Unable to send message');
          mailerError.status = 500;
          mailerError.response = msgResponse
          mailerError.payload = payload
          return reject(mailerError)
        }
      })
      .catch(err => {
        err.payload = payload;
        return reject(err);
      })

  })
}
