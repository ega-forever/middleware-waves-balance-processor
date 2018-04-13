const request = require('request-promise'),
  config = require('../config'),
  _ = require('lodash'),
  {URL} = require('url'),
  bunyan = require('bunyan'),
  Promise = require('bluebird'),
  log = bunyan.createLogger({name: 'wavesBlockprocessor.nodeSenderService'});




const get = query => makeRequest(query, 'GET');


const makeRequest = (path, method, body, headers = {}) => {
  const options = {
    method,
    body,
    uri: new URL(path, config.node.rpc),
    json: true,
    headers
  };
  return request(options).catch(async (e) => await errorHandler(e));
};


const errorHandler = async (err) => {
  if (err.name && err.name === 'StatusCodeError')
    await Promise.delay(10000);
  log.error(err);
};


const getBalanceByAddress = async (address) => {
  const result = await get(`/addresses/balance/${address}`);
  return _.get(result, 'balance', null);
};

const getBalanceByAddressAndAsset = async (address, assetId) => {
  const result = await get(`/assets/balance/${address}/${assetId}`);
  return _.get(result, 'balance', null);
};



module.exports = {
  getBalanceByAddress,
  getBalanceByAddressAndAsset
};
