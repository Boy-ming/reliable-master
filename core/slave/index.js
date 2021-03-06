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

const co = require('co');
const cluster = require('cluster');

const Manager = require('./manager');
const _ = require('../../common/utils/helper');

exports.middleware = function *(next) {
  if (this.url === '/' && this.method === 'POST') {
    if (process._isReady) {
      const post = yield _.parse(this);
      process.send({
        message: 'bindSlave',
        data: post
      });
      this.body = {
        status: 'ack'
      };
    }
  } else if (this.url === '/slaves' && this.method === 'GET') {
    this.body = yield _.getArchiveConfig('slaves');
  } else {
    yield next;
  }
};

exports.init = function() {
  if (cluster.isMaster) {
    process.slaveManager = process.slaveManager || new Manager();

    Object.keys(cluster.workers).forEach((id) => {
      cluster.workers[id].on('message', (e) => {
        switch (e.message) {
          case 'bindSlave':
            process.slaveManager.bind(e.data);
            break;
          case 'dispatch':
            process.slaveManager.dispatch(e.data);
            break;
        }
      });
      cluster.workers[id].send({
        message: 'slaveReady'
      });
    });
  }
};
