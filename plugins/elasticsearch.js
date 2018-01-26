'use strict';

module.exports = function(options) {
  options = options || {};

  var elasticsearch = require('elasticsearch');
  var client = new elasticsearch.Client({
    host: options.host + ":" + options.port,
    httpAuth: ''
  });

  return async function(ctx, next) {
    ctx.elasticsearch = client;
    await next();
  }
}
