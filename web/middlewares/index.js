/* ================================================================
 * reliable-master by xdf(xudafeng[at]126.com)
 *
 * first created at : Tue Mar 17 2015 00:16:10 GMT+0800 (CST)
 *
 * ================================================================
 * Copyright xdf
 *
 * Licensed under the MIT License
 * You may not use this file except in compliance with the License.
 *
 * ================================================================ */

'use strict';

const csrf = require('koa-csrf');
const redisStore = require('koa-redis');
const session = require('koa-generic-session');

const slave = require('../../core/slave');
const redisClient = require('../../core/redis');
const logger = require('../../common/utils/logger');

const middlewares = ['i18n', 'inject', 'favicon', 'powerby', 'static'];

module.exports = function(app) {
  app.use(logger.middleware);
  app.use(slave.middleware);
  app.keys = [app._options.pkg.name];
  app.use(session({
    store: redisStore({
      client: redisClient
    })
  }));
  csrf(app);
  app.use(function *(next) {
    let apiReg = /^\/api\//;
    if (apiReg.test(this.path)) {
      yield next;
    } else {
      app.use(csrf.middleware);
      yield next;
    }
  });
  logger.debug('base middlewares attached');

  middlewares.forEach(function(middleware) {
    app.use(require(`./${middleware}`)(app));
    logger.debug(`middleware: ${middleware} registed`);
  });
};
