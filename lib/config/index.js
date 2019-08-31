"use strict";
const debug = require("debug")("pioneera-email:config");

const isBase64 = function(data) {
  if (!(data && data.length > 0)) return false;
  const base64 = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  return base64.test(data);
}

const splitOnce = function(data, search = "_") {
  const components = data.split(search);
  if (components.length > 1) return [components.shift(), components.join(search)];
  return;
}

module.exports = function(categories){
  const config = {};
  Object.keys(process.env).forEach(function(element) {
    const parts = splitOnce(element);
    if (parts && parts[0] && parts[1]) {
      if (categories.includes(parts[0])) {
        const data = process.env[element];
        if (!config.hasOwnProperty(parts[0])) config[parts[0]] = {};
        config[parts[0]][parts[1]] = (isBase64(data)) ? Buffer.from(data, 'base64').toString("utf8") : data;
      }
    }
  });
  debug("Configuration Loaded", JSON.stringify(config,null,2));
  return config;
}
