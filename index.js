"use strict";
const debug = require("debug")("indiebot-chat:emailer");
const EventEmitter = require('events');
const Handlebars = require('handlebars');

const deliveryAgents = {
  nodemailer: require('./lib/nodemailer'),
  postmark: require('./lib/postmark'),
  sendgrid: require('./lib/sendgrid')
}

const configCategories = [
  'APPLICATION',
  'NODEMAILER',
  'SENDGRID',
  'POSTMARK',
  'EMAIL',
  'RAYGUN',
  'GA'
]

class Emailer extends EventEmitter {
  constructor(agent = 'postmark', config = null) {
    super();
    if(!deliveryAgents.hasOwnProperty(agent)){
      const invalidDeliveryAgent = new Error(`No support for delivery agent ${agent}`);
      invalidDeliveryAgent.status = 500;
      throw invalidDeliveryAgent;
    }
    if (config) {
      this._config = config;
    } else {
      this._config = require('./lib/config')(configCategories);
    }
    this._deliveryAgentName = agent;
    this._deliveryAgent = deliveryAgents[agent];
    this._from = this.defaultFrom();
  }

  generateMessage(emailer, payload = {}) {
    if (emailer.to && !payload.to) payload.to = emailer.to;
    if (emailer.cc && !payload.cc) payload.cc = emailer.cc;
    if (emailer.bcc && !payload.bcc) payload.bcc = emailer.bcc;
    if (emailer.from && !payload.from) payload.from = emailer.from;
    if (emailer.replyTo && !payload.replyTo) payload.replyTo = emailer.replyTo;
    const htmlLayout = (this._config && this._config.EMAIL && this._config.EMAIL.LAYOUT_HTML) ? this._config.EMAIL.LAYOUT_HTML : "{{{body}}}";
    const textLayout = (this._config && this._config.EMAIL && this._config.EMAIL.LAYOUT_TEXT) ? this._config.EMAIL.LAYOUT_TEXT : "{{{body}}}";
    const hbsHtml = Handlebars.compile(htmlLayout);
    const hbsText = Handlebars.compile(textLayout);
    const applicationData = (this._config && this._config.APPLICATION) ? JSON.parse(JSON.stringify(this._config.APPLICATION)) : {};
    let data = (emailer.data && !payload.data) ? emailer.data : payload.data;
    if (!data) data = {};
    data = Object.assign(data, applicationData);
    const html = Handlebars.compile((emailer.html && !payload.html) ? emailer.html : payload.html);
    const text = Handlebars.compile((emailer.text && !payload.text) ? emailer.text : payload.text);
    const subject = Handlebars.compile((emailer.subject && !payload.subject) ? emailer.subject : payload.subject);
    const htmlBody = html(data);
    const textBody = text(data);
    data.body = htmlBody;
    payload.html = hbsHtml(data);
    data.body = textBody;
    payload.text = hbsText(data);
    payload.subject = subject(data);

    payload.trackOpens = (emailer.trackOpens) ? true : false;
    payload.trackHtmlLinks = (emailer.trackHtmlLinks) ? true : false;
    payload.trackTextLinks = (emailer.trackTextLinks) ? true : false;
    payload.trackLinks = (emailer.trackLinks) ? true : false;

    if (emailer.headers) payload.headers = emailer.headers;
    if (emailer.attachments) payload.attachments = emailer.attachments;
    if (emailer.metadata) payload.metadata = emailer.metadata;

    return payload;
  };

  defaultFrom() {
    let from;
    if (this._config && this._config.EMAIL && this._config.EMAIL.DEAFULT_FROMNAME) {
      from = this._config.EMAIL.DEAFULT_FROMNAME;
    } else {
      from = '';
    }
    if (this._config && this._config.EMAIL && this._config.EMAIL.DEAFULT_FROMEMAIL) {
      const emailSuffix = (from.length > 0) ? '>' : '';
      const emailPrefix = (from.length > 0) ? ' <' : '';
      from += emailPrefix + this._config.EMAIL.DEAFULT_FROMEMAIL + emailSuffix;
    }
    return from;
  };

  send(payload = {}) {
    const _self = this;
    return new Promise(function(resolve, reject) {
      const msg = _self.generateMessage(_self, payload);
      if (!msg.to) {
        const noToError = new Error('Unable to send email with no recipient');
        noToError.status = 500;
        return reject(noToError);
      }
      _self._deliveryAgent(msg, _self._config)
        .then(msgResponse => {
          return resolve({
            agent: _self._deliveryAgentName,
            id: msgResponse
          });
        })
        .catch(error => {
          return reject(error);
        });
    });
  }

  addHeader(name, value) {
    if (!this._headers) this._headers = [];
    this._headers.push({
      name: name,
      value: value
    });
  }

  addAttachment(name, content, contentType, contentId = null) {
    if (!this._attachments) this._attachments = [];
    let attachment = {
      name: name,
      content: content,
      contentType: contentType
    };
    if (contentId) attachment.contentId = contentId;
    this._attachments.push(attachment);
  }

  get to() {
    return this._to;
  }

  set to(value) {
    if (!value) return delete this._to;
    if (Array.isArray(value)) {
      this._to = value;
    } else {
      this._to = [value];
    }
  }

  get cc() {
    return this._cc;
  }

  set cc(value) {
    if (!value) return delete this._cc;
    if (Array.isArray(value)) {
      this._cc = value;
    } else {
      this._cc = [value];
    }
  }

  get bcc() {
    return this._bcc;
  }

  set bcc(value) {
    if (!value) return delete this._bcc;
    if (Array.isArray(value)) {
      this._bcc = value;
    } else {
      this._bcc = [value];
    }
  }

  get from() {
    return this._from;
  }

  set from(value) {
    if (!value) return this._from = defaultFrom();
    this._from = value;
  }

  get replyTo() {
    return this._replyTo;
  }

  set replyTo(value) {
    if (!value) return delete this._replyTo;
    this._replyTo = value;
  }

  get subject() {
    return this._subject;
  }

  set subject(value) {
    if (!value) return delete this._subject;
    this._subject = value;
  }

  get html() {
    return this._html;
  }

  set html(value) {
    if (!value) return delete this._html;
    this._html = value;
  }

  get text() {
    return this._text;
  }

  set text(value) {
    if (!value) return delete this._text;
    this._text = value;
  }

  get data() {
    return this._data;
  }

  set data(value) {
    if (!value) return delete this._data;
    this._data = value;
  }

  get trackOpens() {
    if (this._trackOpens) return true;
    return false;
  }

  set trackOpens(value) {
    if (value) return this._trackOpens = true;
    delete this._trackOpens;
  }

  get trackHtmlLinks() {
    if (this._trackHtmlLinks) return true;
    return false;
  }

  set trackHtmlLinks(value) {
    if (value) return this._trackHtmlLinks = true;
    delete this._trackHtmlLinks;
  }

  get trackTextLinks() {
    if (this._trackTextLinks) return true;
    return false;
  }

  set trackTextLinks(value) {
    if (value) return this._trackTextLinks = true;
    delete this._trackTextLinks;
  }

  get trackLinks() {
    if (this.trackHtmlLinks && this.trackTextLinks) {
      return true;
    }
    return false;
  }

  set trackLinks(value) {
    if (value) {
      this.trackHtmlLinks = true;
      this._trackTextLinks = true;
    } else {
      this.trackHtmlLinks = false;
      this._trackTextLinks = false;
    }
  }

  get headers() {
    if (this._headers) return this._headers;
    return;
  }

  set headers(value) {
    if (value) return this._headers = value;
    delete this._headers;
  }

  get attachments() {
    if (this._attachments) return this._attachments;
    return;
  }

  set attachments(value) {
    if (value) return this._attachments = value;
    delete this._attachments;
  }

  get metadata() {
    return this._metadata;
  }

  set metadata(value) {
    if (!value) return delete this._metadata;
    this._metadata = value;
  }

}

module.exports = Emailer;
