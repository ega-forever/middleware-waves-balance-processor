/**
 * Middleware service for handling user balance. 
 * Update balances for accounts, which addresses were specified
 * in received transactions from blockParser via amqp
 * 
 * @module Chronobank/eth-balance-processor
 * @requires config
 * @requires models/accountModel
 */

const config = require('./config'),
  mongoose = require('mongoose'),
  accountModel = require('./models/accountModel'),
  net = require('net'),
  bunyan = require('bunyan'),
  Promise = require('bluebird'),
  RPC = require('./utils/RPC'),
  log = bunyan.createLogger({name: 'core.balanceProcessor'}),
  amqp = require('amqplib');

mongoose.Promise = Promise;
mongoose.connect(config.mongo.uri, {useMongoClient: true});

mongoose.connection.on('disconnected', function () {
  log.error('mongo disconnected!');
  process.exit(0);
});


let init = async () => {
  let conn = await amqp.connect(config.rabbit.url)
    .catch(() => {
      log.error('rabbitmq is not available!');
      process.exit(0);
    });

  let channel = await conn.createChannel();

  channel.on('close', () => {
    log.error('rabbitmq process has finished!');
    process.exit(0);
  });

  await channel.assertExchange('events', 'topic', {durable: false});
  await channel.assertQueue(`app_${config.rabbit.serviceName}.balance_processor`);
  await channel.bindQueue(`app_${config.rabbit.serviceName}.balance_processor`, 'events', `${config.rabbit.serviceName}_transaction.*`);
  
  channel.prefetch(2);
  channel.consume(`app_${config.rabbit.serviceName}.balance_processor`, async (data) => {
    try {
      let tx = JSON.parse(data.content.toString());
      let accounts = tx ? await accountModel.find({address: {$in: [tx.sender, tx.recipient]}}) : [];

      for (let account of accounts) {
        let result = await RPC(`addresses.balance.${account.address}`);
        await accountModel.update({address: account.address}, {$set: {balance: result.balance}})
          .catch(() => {
          });

        await  channel.publish('events', `${config.rabbit.serviceName}_balance.${account.address}`, new Buffer(JSON.stringify({
          address: account.address,
          balance: result.balance,
          tx: tx
        })));
      }

    } catch (e) {
      log.error(e);
    }

    channel.ack(data);
  });
};

module.exports = init();
