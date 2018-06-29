/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const config = require('../config'),
  Api = require('../utils/api/Api'),
  providerServiceInterface = require('middleware-common-components/interfaces/blockProcessor/providerServiceInterface'),
  AbstractProvider = require('middleware-common-components/abstract/universal/AbstractProvider');

/**
 * @service
 * @description the service for handling connection to node
 * @returns Object<ProviderService>
 */

class ProviderService extends AbstractProvider {

  constructor () {
    super();
  }


  /** @function
   * @description reset the current connection
   */
  resetConnector () {
    this.connector = null;
    this.switchConnector();
    this.events.emit('disconnected');
  }


  /**
   * @function
   * @description start listen for provider updates from block processor
   * @private
   */
  _startListenProviderUpdates () {

    this.rabbitmqChannel.consume(`${config.rabbit.serviceName}_provider.${this.id}`, async (message) => {
      message = JSON.parse(message.content.toString());
      const providerURI = config.node.providers[message.index];

      if (this.connector && this.connector.http === providerURI.http)
        return;

      this.connector = new Api(providerURI);

      this.connector.events.on('disconnect', () => this.resetConnector());
      this.events.emit('provider_set');
    }, {noAck: true});

  }

}

module.exports = providerServiceInterface(new ProviderService());
