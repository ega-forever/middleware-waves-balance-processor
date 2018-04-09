const config = require('./config'),
  Promise = require('bluebird'),
  mongoose = require('mongoose');

mongoose.Promise = Promise;
mongoose.accounts = mongoose.createConnection(config.mongo.accounts.uri);
mongoose.connect(config.mongo.data.uri, {useMongoClient: true});

const expect = require('chai').expect,
  SockJS = require('sockjs-client'),
  accountModel = require('../models/accountModel'),
  amqp = require('amqplib'),
  WebSocket = require('ws'),
  saveAccountForAddress = require('./helpers/saveAccountForAddress'),
  connectToQueue = require('./helpers/connectToQueue'),
  clearQueues = require('./helpers/clearQueues'),
  consumeMessages = require('./helpers/consumeMessages'),
  consumeStompMessages = require('./helpers/consumeStompMessages'),
  requests = require('./services/nodeRequests'),
  Stomp = require('webstomp-client'),
  BigNumber = require('bignumber.js');
  ASSET_NAME = 'LLLLLLLLLLL',
  createIssue = require('./helpers/createIssue');

let accounts, amqpInstance, assetId;

describe('core/balance processor', function () {

  before(async () => {
    await accountModel.remove();
    amqpInstance = await amqp.connect(config.rabbit.url);

    accounts = config.dev.accounts;
    await saveAccountForAddress(accounts[0]);
    await clearQueues(amqpInstance);
    assetId = await createIssue(ASSET_NAME, accounts[0]);

  });

  after(async () => {
    return mongoose.disconnect();
  });

  afterEach(async () => {
      await clearQueues(amqpInstance);
  });

  it('send 100 waves from account0 to account1 and validate message', async () => {
    const initBalance = new BigNumber(await requests.getBalanceByAddress(accounts[0]));

    const checkMessage = (content) => {
      expect(content).to.contain.all.keys(
        'address',
        'balance',
        'assets',
        'tx'
      );
      expect(content.address).to.equal(accounts[0]);
      expect(initBalance.minus(content.balance).toNumber()).to.greaterThan(0);
      expect(content.tx.id).to.equal(transferTx.id);
    };

    const transferTx = await requests.signTransaction(
      config.dev.apiKey, accounts[1], 100, accounts[0]);

    return await Promise.all([
      (async() => {
         await requests.sendTransaction(config.dev.apiKey, transferTx);
      })(),
      (async () => {
        const channel = await amqpInstance.createChannel();  
        await connectToQueue(channel);
        return await consumeMessages(2, channel, (message) => {
          const content = JSON.parse(message.content);
          if (content.tx.id === transferTx.id)
            return checkMessage(content);
        });
      })(),
      (async () => {
        const ws = new WebSocket('ws://localhost:15674/ws');
        const client = Stomp.over(ws, {heartbeat: false, debug: false});
        return await consumeStompMessages(2, client, (message) => {
          const content = JSON.parse(message.body);
          if (content.tx.id === transferTx.id)
            return checkMessage(content);
        });
      })()
    ]);
  });

  it('send 100 waves from account1 to account0 and validate message', async () => {
    const initBalance = await requests.getBalanceByAddress(accounts[0]);

    const checkMessage = (content) => {
      expect(content).to.contain.all.keys(
        'address',
        'balance',
        'assets',
        'tx'
      );
      expect(content.address).to.equal(accounts[0]);
      expect(content.balance).to.greaterThan(new BigNumber(initBalance).add(100));
      expect(content.tx.id).to.equal(transferTx.id);
    };

    const transferTx = await requests.signTransaction(
      config.dev.apiKey, accounts[1], 100, accounts[0]);

    return await Promise.all([
      (async() => {
         await requests.sendTransaction(config.dev.apiKey, transferTx);
      })(),
      (async () => {
        const channel = await amqpInstance.createChannel();  
        await connectToQueue(channel);
        return await consumeMessages(2, channel, (message) => {
          const content = JSON.parse(message.content);
          if (content.tx.id === transferTx.id)
            return checkMessage(content);
        });
      })()
    ]);
  });


  it('send 100 assets from account0 to account 1 and validate message', async () => {
      const initBalance = await requests.getBalanceByAddressAndAsset(accounts[0], assetId);
      const checkMessage = (content) => {        
        expect(content).to.contain.all.keys(
          'address',
          'balance',
          'assets',
          'tx'
        );
        expect(content.address).to.equal(accounts[0]);
        expect(content.balance).to.greaterThan(initBalance + 100);
        expect(content.tx.id).to.equal(transferTx.id);
      };
  
      const transferTx = await requests.signAssetTransaction(config.dev.apiKey, accounts[1], 100, accounts[0], assetId);
  
      return await Promise.all([
        (async() => {
           await requests.sendAssetTransaction(config.dev.apiKey, transferTx);
           
        })(),
        (async () => {
          const channel = await amqpInstance.createChannel();  
          await connectToQueue(channel);
          return await consumeMessages(2, channel, (message) => {
            const content = JSON.parse(message.content);
            if (content.tx.id === transferTx.id)
              return checkMessage(content);
          });
        })()
      ]);
  });


  it('send alias transaction and validate message', async () => {
    const initBalance = await requests.getBalanceByAddress(accounts[0]);
    const checkMessage = (content) => {        
      expect(content).to.contain.all.keys(
        'address',
        'balance',
        'assets',
        'tx'
      );
      expect(content.address).to.equal(accounts[0]);
      expect(content.balance).to.lessThan(initBalance);
      expect(content.tx.id).to.equal(transferTx.id);
    };

    const alias = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const transferTx = await requests.signAliasTransaction(config.dev.apiKey, accounts[0], 100000, alias);

    return await Promise.all([
      (async() => {
         await requests.sendAliasTransaction(config.dev.apiKey, transferTx);
         
      })(),
      (async () => {
        const channel = await amqpInstance.createChannel();  
        await connectToQueue(channel);
        return await consumeMessages(1, channel, (message) => {
          const content = JSON.parse(message.content);
          if (content.tx.id === transferTx.id)
            return checkMessage(content);
        });
      })()
    ]);
});

  it('delete accounts and 0 messages', async () => {
    await accountModel.remove();
    const transferTx = await requests.signTransaction(
      config.dev.apiKey, accounts[1], 100, accounts[0]);

    return await Promise.all([
      (async() => {
         await requests.sendTransaction(config.dev.apiKey, transferTx);
      })(),
      (async () => {
        await Promise.delay(12000);
        const channel = await amqpInstance.createChannel();  
        const queue = await connectToQueue(channel);
        expect(queue.messageCount).to.equal(0);
      })()
    ]);
  });

});
