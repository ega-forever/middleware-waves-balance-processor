/**
 *
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const config = require('./config'),
  Promise = require('bluebird'),
  mongoose = require('mongoose'),
  expect = require('chai').expect,
  providerService = require('./services/providerService'),
  accountModel = require('../models/accountModel'),
  amqp = require('amqplib'),
  connectToQueue = require('./helpers/connectToQueue'),
  clearQueues = require('./helpers/clearQueues'),
  consumeMessages = require('./helpers/consumeMessages'),
  ASSET_NAME = 'LLLLLLLLLLL',
  createIssue = require('./helpers/createIssue'),
  ctx = {
  accounts: [],
  amqp: {}
  };

let assetId;

mongoose.Promise = Promise;
mongoose.connect(config.mongo.accounts.uri, {useMongoClient: true});

describe('core/balance processor', function () {

  before(async () => {
    await accountModel.remove();
    ctx.amqp.instance = await amqp.connect(config.rabbit.url);
    ctx.amqp.channel = await ctx.amqp.instance.createChannel();
    await providerService.setRabbitmqChannel(ctx.amqp.channel, config.rabbit.serviceName);

    ctx.accounts = config.dev.accounts;
    await accountModel.create({address: ctx.accounts[0]});
    //await clearQueues(ctx.amqp.instance);
    assetId = await createIssue(ASSET_NAME, ctx.accounts[0]);

  });

  after(async () => {
    return mongoose.disconnect();
  });

  afterEach(async () => {
    //await clearQueues(ctx.amqp.instance);
  });

  it('send 100 waves from account0 to account1 and validate message', async () => {

    const provider = await providerService.get();

    const initBalance = await provider.getBalanceByAddress(ctx.accounts[0]);

    const checkMessage = (content) => {
      expect(content).to.contain.all.keys(
        'address',
        'balance',
        'assets',
        'tx'
      );
      expect(content.address).to.equal(ctx.accounts[0]);
      expect(initBalance - content.balance).to.not.equal(0);
      return true;
    };

    const tx = await provider.signTransaction(
      config.dev.apiKey, ctx.accounts[1], 100, ctx.accounts[0]);
    return await Promise.all([
      (async () => {
        let response = await provider.sendTransaction(config.dev.apiKey, tx);
        console.log(response);
      })(),
      (async () => {
        await connectToQueue(ctx.amqp.channel);
        return await consumeMessages(1, ctx.amqp.channel, (message) => {
          const content = JSON.parse(message.content);
          console.log(content)
          if (content.tx.id === tx.id && content.tx.blockNumber !== -1)
            return checkMessage(content);
          return false;
        });
      })()
    ]);
  });


});
