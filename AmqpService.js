/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const EventEmitter = require('events'),
  amqp = require('amqplib');

/**
 * Class for subscribe on amqp events 
 * from other middlewares
 * listen only selected messages
 * 
 * @class AmqpServer
 * @extends {EventEmitter}
 */
class AmqpService extends EventEmitter
{
  /**
   * 
   * constructor
   * @param {String} url
   * @param {String} exchange
   * @param {String} serviceName
   * options are:
   * url - url for rabbit
   * exchange - name exchange in rabbit
   * serviceName - service name of  created queues for binding in rabbit
   * 
   */
  constructor (url, exchange, serviceName) {
    if (!url || !exchange || !serviceName)
      throw new Error('Not set url, exchange, serverName for constructor');
    super();
    this.url  = url;
    this.exchange = exchange;
    this.serviceName = serviceName;
  }


  /**
   * function for start (connect to rabbit)
   * 
   * @memberOf AmqpServer
   */
  async start () {
    this.amqpInstance = await amqp.connect(this.url);

    this.channel = await this.amqpInstance.createChannel();
    this._onClosed = () => {
      throw new Error('rabbitmq process has finished!');
    };
    this.channel.on('close', this._onClosed);
  }



  /**
   * function to subscribe to this channel
   * when get msg on this channel
   *  emit msg with type=emitMessage parameter
   * 
   * @param {String} routing 
   * @param {String} emitMessage
   * 
   * @memberOf AmqpServer
   */
  async addBind (routing, emitMessage) {
    await this.channel.assertQueue(`${this.serviceName}.${routing}`);
    await this.channel.bindQueue(`${this.serviceName}.${routing}`, this.exchange, 
      `${this.serviceName}.${routing}`);
    console.log('BIND QUEUE', `${this.serviceName}.${routing}`);
    this.channel.consume(`${this.serviceName}.${routing}`, async (data) => {
        console.log('GET MESSAGE', `${this.serviceName}.${routing}`);
      if (data.fields.routingKey === `${this.serviceName}.${routing}`)
        this.emit(emitMessage, JSON.parse(data.content), data.fields.routingKey);
      this.channel.ack(data);
    });
  }


  /**
   * 
   * Function to publish msg
   * 
   * @param {String} routing 
   * @param {String} msg 
   * 
   * @memberOf AmqpService
   */
  async publishMsg (routing, msg) {
    return await this.channel.publish(this.exchange, `${this.serviceName}.${routing}`, 
      new Buffer(JSON.stringify(msg)));
  }



  /**
   * function to unsubscribe from this channel
   * 
   * @param {String} routing 
   * 
   * @memberOf AmqpServer
   */
  async delBind (routing) {
    await this.channel.cancel(`${this.serviceName}.${routing}`);
  }

  /**
   * Function for close connection to rabbitmq
   *
   *
   * @memberOf AmqpServer
   */
  async close () {
    if (this._onClosed && this.channel)
      this.channel.removeListener('close', this._onClosed);

    if (this.channel)
      await this.channel.close();
    await this.amqpInstance.close();
  }
}

module.exports = AmqpService;

