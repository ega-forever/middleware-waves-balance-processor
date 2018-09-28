/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */
const Promise = require('bluebird'),
  EventEmitter = require('events'),
  _ = require('lodash'),
  InfrastructureInfo = require('middleware_common_infrastructure/InfrastructureInfo'),
  AmqpService = require('middleware_common_infrastructure/AmqpService');

const checkingKey = name => `${name}.checking`;
const checkedKey = name => `${name}.checked`;
const majorVersion = version => version.split('.')[0];
const verifyVersion = (version, compareVersion) => {
  return majorVersion(version) === majorVersion(compareVersion);
};


/**
 * Service for checking requirements own dependencies
 * and for send own version for required services
 * 
 * 
 * wait for msg with type=rabbitName.serviceName.checking  
 * and send msg with type=rabbitName.serviceName.checked with content={version: myVersion}
 * 
 * periodically for checkInterval checked own dependencies
 * for all dependencies:
 *     send msg with type=rabbitName.serviceName.checking
 *     wait msg with type=rabbitName.serviceName.checked
 *       and check that field version from msg content 
 *            in major version equals to major version of version requirement
 * 
 * @class InfrastructureService
 * @extends {EventEmitter}
 */
class InfrastructureService extends EventEmitter
{
  
  /**
   * Creates an instance of InfrastructureService.
   * @param {function(new: ./InfrastrutureInfo)} info 
   * @param {function(new: ./AmqpService)} amqpService
   * @param {{checkInterval: String}} options
   * 
   * @memberOf InfrastructureService
   */
  constructor (info, amqpService, options = {}) {
    if (!info || !(info instanceof InfrastructureInfo))
      throw new Error('not set right info in params');
    super();
    
    this.info = info;
    this.rabbit = amqpService;
    this.checkIntervalTime = options.checkIntervalTime || 10000;

    this.REQUIREMENT_ERROR = 'requirement_error';
  }


  /**
   * Function for check all requiements of this object
   * 
   * @returns {Boolean}
   * 
   * @memberOf InfrastructureService
   */
  async checkRequirements () {
    const verifyResults = await Promise.map(
      this.info.requirements, this._checkRequirement.bind(this)
    )
      .catch(e => { throw e; });
    return _.reduce(verifyResults, (result, item) => (result && item), true);
  }

  async _sendMyVersion () {
    await this.rabbit.publishMsg(checkedKey(this.info.name), {
      version: this.info.version
    });
  }
  _requirementError (requirement, version) {
    this.emit(this.REQUIREMENT_ERROR, requirement, version);
  }

  /**
   * Function for check Requirement
   * Main function
   * 
   * @param {any} requirement 
   * 
   * @memberOf InfrastructureService
   */
  async _checkRequirement (requirement) {
    // bind on channel with responds from requirements - block.checked, balance.checked...
    await this.rabbit.addBind(checkedKey(requirement.name), checkedKey(requirement.name));
    console.log('BINDED', checkedKey(requirement.name));

    let lastVersion;
    const verifyResult = await Promise.all([
      /**
       * wait respond from requirement on block.checked
       * get data.version and verify it
       * 
       */
      new Promise(res => this.rabbit.on(checkedKey(requirement.name), ({version}) => {
        lastVersion = version;
        console.log('get checked ', checkedKey(requirement.name));
        if (verifyVersion(version, requirement.version)) 
          res(true);
      })),
      /**
      * publish request to channel = block.checking, balance.checking
      */
      (async () => {
        console.log('publish', checkingKey(requirement.name));
        await this.rabbit.publishMsg(checkingKey(requirement.name), {
          version: requirement.version
        });
        return true;
      })(),
    ])
      .timeout(requirement.maxWait)
      .catch(Promise.TimeoutError, () => {
        this._requirementError(requirement, lastVersion);
        return false;
      });
    // unbind
    await this.rabbit.delBind(checkedKey(requirement.name));

    return verifyResult !== false;
  }


  /**
   * function start rabbitmq server
   * 
   * @memberOf InfrastructureService
   */
  async start () {
    await this.rabbit.start();
    await this.rabbit.channel.assertExchange(this.rabbit.exchange, 'topic', {durable: false});
    await this.rabbit.addBind(checkingKey(this.info.name), checkingKey(this.info.name));
    
    this.rabbit.on(checkingKey(this.info.name), async () =>  {
      await this._sendMyVersion();
    });

  }

  /**
   * Function for check periodically in background down for requirements
   * 
   * 
   * @memberOf InfrastructureService
   */
  periodicallyCheck () {
    this._checkInterval = setInterval(this.checkRequirements.bind(this), 
      this.checkIntervalTime);
  }

  /**
   * Function for close rabbit connections
   * 
   * @memberOf InfrastructureService
   */
  async close () {
    if (this._checkInterval)
      clearInterval(this._checkInterval);
    await this.rabbit.delBind(checkingKey(this.info.name));
    await this.rabbit.close();
  }
}
module.exports = InfrastructureService;
