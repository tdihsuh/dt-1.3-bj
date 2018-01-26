'use strict';

module.exports = function() {
  return async function(ctx, next) {
    ctx.library = function(library) {
      try {
        return require("../libraries/" + library)
      } catch (err) {
        ctx.throw(400, err.message)
      }
    }
    await next()
  }
}
