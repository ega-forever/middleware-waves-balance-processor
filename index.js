/**
 * Middleware service for handling user balance.
 * Update balances for accounts, which addresses were specified
 * in received transactions from blockParser via amqp
 *
 * @module Chronobank/waves-balance-processor
 * @requires config
 * @requires models/accountModel
 * 
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */

const config = require('./config'),
  mongoose = require('mongoose'),
  _ = require('lodash'),
  Promise = require('bluebird');

mongoose.Promise = Promise;
mongoose.accounts = mongoose.createConnection(config.mongo.accounts.uri, {useMongoClient: true});


const accountModel = require('./models/accountModel'),
  requests = require('./services/nodeRequests'),
  bunyan = require('bunyan'),
  log = bunyan.createLogger({name: 'core.balanceProcessor'}),
  amqp = require('amqplib');

mongoose.accounts.on('disconnected', function () {
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
      const txAccounts = _.filter([tx.sender, tx.recipient], item => item !== undefined);        
      let accounts = tx ? await accountModel.find({address: {$in: txAccounts}}) : [];
      for (let account of accounts) {
        if (!tx.assetId) {
          const balance = await requests.getBalanceByAddress(account.address);
          account = await accountModel.findOneAndUpdate(
            {address: account.address}, 
            {$set: {balance: balance}}, 
            {upsert: true, new: true}
          ).catch(log.error);
        } else {
          const balance = await requests.getBalanceByAddress(account.address);          
          const assetBalance = await requests.getBalanceByAddressAndAsset(account.address, tx.assetId);
          account = await accountModel.findOneAndUpdate({address: account.address},
            {$set: {
              balance: balance,
              assets: {
                [`${tx.assetId}`]: assetBalance
              }
            }}, {upsert: true, new: true})
            .catch(log.error);
            
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
