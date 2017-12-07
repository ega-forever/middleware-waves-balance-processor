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

      if(tx.type !== 4)
        return channel.ack(data);

      let accounts = tx ? await accountModel.find({address: {$in: [tx.sender, tx.recipient]}}) : [];

      for (let account of accounts) {
        if (!tx.assetId) {
          let result = await RPC(`addresses.balance.${account.address}`);
          account = await accountModel.findOneAndUpdate({address: account.address}, {$set: {balance: result.balance}}, {upsert: true})
            .catch(() => {
            });
        }

        if (tx.assetId) {
          let result = await RPC(`addresses.balance.${account.address}`);
          account = await accountModel.findOneAndUpdate({address: account.address}, {$set: {[`assets.${tx.assetId}`]: result.balance}}, {upsert: true})
            .catch(() => {
            });
        }

        await  channel.publish('events', `${config.rabbit.serviceName}_balance.${account.address}`, new Buffer(JSON.stringify({
          address: account.address,
          balance: account.balance,
          assets: account.assets,
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
