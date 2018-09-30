/**
 * Chronobank/waves-balance-processor configuration
 * @module config
 * @returns {Object} Configuration
 *
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */

require('dotenv').config();
const _ = require('lodash');

const config = {
  mongo: {
    accounts: {
      uri: process.env.MONGO_ACCOUNTS_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/data',
      collectionPrefix: process.env.MONGO_ACCOUNTS_COLLECTION_PREFIX || process.env.MONGO_COLLECTION_PREFIX || 'waves'
    }
  },
  rabbit: {
    url: process.env.RABBIT_URI || 'amqp://localhost:5672',
    serviceName: process.env.RABBIT_SERVICE_NAME || 'app_waves'
  },
  node: {
    providers: _.chain(process.env.PROVIDERS || 'http://localhost:6869@')
      .split(',')
      .map(provider => {
        const data = provider.split('@');
        return {
          http: data[0].trim(),
          ws: ''
        };
      })
      .value()
  },
  systemRabbit: {
    url: process.env.SYSTEM_RABBIT_URI || process.env.RABBIT_URI || 'amqp://localhost:5672',
    exchange: process.env.SYSTEM_RABBIT_EXCHANGE || 'internal',
    serviceName: process.env.SYSTEM_RABBIT_SERVICE_NAME || 'system' 
  },
  system: {
    waitTime: process.env.SYSTEM_WAIT_TIME ? parseInt(process.env.SYSTEM_WAIT_TIME) : 10000    
  },
  checkSystem: process.env.CHECK_SYSTEM ? parseInt(process.env.CHECK_SYSTEM) : true,
  logs: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

module.exports = config;
