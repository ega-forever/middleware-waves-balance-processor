const EventEmitter = require('events'),
  Promise = require('bluebird'),
  _ = require('lodash'),
  request = require('request-promise'),
  URL = require('url').URL;
/**
 * @service
 * @param URI - the endpoint URI
 * @description http provider for nem node
 */

class Api {

  constructor (URI) {
    this.http = URI.http;
    this.events = new EventEmitter();
  }

  /**
   * @function
   * @description internal method for making requests
   * @param url - endpoint url
   * @param method - the HTTP method
   * @param body - the body of the request
   * @return {Promise<*>}
   * @private
   */
  async _makeRequest (url, method = 'GET', body) {
    const options = {
      method: method,
      body: body,
      uri: new URL(url, this.http),
      json: true
    };
    return Promise.resolve(request(options)).timeout(10000);
  }


  /**
   *
   * @param {String} address
   * @return {Number}
   */
  async getBalanceByAddress (address)  {
    const result = await this._makeRequest(`/addresses/balance/${address}`);
    return result.balance;
  }

  /**
   *
   * @param {String} address
   * @return {Number}
   */
  async getAssetBalanceByAddress (address) {
    const response = await this._makeRequest(`/assets/balance/${address}`);
    return _.get(response, 'balances', []);
  }

}

module.exports = Api;
