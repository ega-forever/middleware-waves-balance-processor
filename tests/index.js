/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

require('dotenv/config');
process.env.LOG_LEVEL = 'error';

const config = require('./config'),
  models = require('../models'),
  fs = require('fs'),
  _ = require('lodash'),
  WavesAPI = require('@waves/waves-api'),
  fuzzTests = require('./fuzz'),
  request = require('request-promise'),
  providerService = require('../services/providerService'),
  performanceTests = require('./performance'),
  featuresTests = require('./features'),
  blockTests = require('./blocks'),
  Promise = require('bluebird'),
  mongoose = require('mongoose'),
  amqp = require('amqplib'),
  spawn = require('child_process').spawn,
  ctx = {};

mongoose.Promise = Promise;
mongoose.connect(config.mongo.accounts.uri, {useMongoClient: true});


describe('core/balanceProcessor', function () {

  before(async () => {
    models.init();
    ctx.accounts = config.dev.accounts;
    ctx.amqp = {};
    ctx.amqp.instance = await amqp.connect(config.rabbit.url);
    ctx.amqp.channel = await ctx.amqp.instance.createChannel();
    await ctx.amqp.channel.assertExchange('events', 'topic', {durable: false});
    await ctx.amqp.channel.assertExchange('internal', 'topic', {durable: false});
    await ctx.amqp.channel.assertQueue(`${config.rabbit.serviceName}_current_provider.get`, {durable: false});
    await ctx.amqp.channel.bindQueue(`${config.rabbit.serviceName}_current_provider.get`, 'internal', `${config.rabbit.serviceName}_current_provider.get`);

    ctx.amqp.channel.consume(`${config.rabbit.serviceName}_current_provider.get`, async () => {
      ctx.amqp.channel.publish('internal', `${config.rabbit.serviceName}_current_provider.set`, new Buffer(JSON.stringify({index: 0})));
    }, {noAck: true});


    await providerService.setRabbitmqChannel(ctx.amqp.channel, config.rabbit.serviceName);

    ctx.checkerPid = spawn('node', ['tests/utils/proxyChecker.js'], {
      env: process.env,
      stdio: 'ignore'
    });

    /*    const nodeConfig = _.merge({}, WavesAPI.TESTNET_CONFIG, {
          networkByte: 'D'.charCodeAt(0),
          nodeAddress: config.providerForTest,
          matcherAddress: `${config.providerForTest}/matcher`
        });

        const Waves = WavesAPI.create(nodeConfig);*/

    if (!fs.existsSync('tests/node'))
      fs.mkdirSync('tests/node');

    if (!fs.existsSync('tests/node/waves.jar')) {
      console.log('going to install waves node');
      const release = await request({
        url: 'https://api.github.com/repos/wavesplatform/waves/releases/latest',
        json: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });


      const nodeFile = await request({
        url: release.assets[0].browser_download_url,
        encoding: 'binary',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      fs.writeFileSync('tests/node/waves.jar', nodeFile, 'binary');

      /*      let configFile = await request({
              url: 'https://raw.githubusercontent.com/wavesplatform/Waves/master/waves-devnet.conf',
              encoding: 'utf-8',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
              }
            });


            configFile = configFile.replace(/(?<=api-key-hash = )(.*)/gm, '"H6nsiifwYKYEx6YzYD7woP1XCn72RVvx6tC1zjjLXqsu"'); //todo replace all addresses

            let accounts = configFile.match(/(?<=")3F.{33}(?=")/gm);
            for (let index = 0; index < accounts.length; index++) {
              if(ctx.accounts[index]) {
                console.log(`replacing ${accounts[index]} => ${ctx.accounts[index].address}`);
                configFile = configFile.replace(accounts[index], ctx.accounts[index].address)
              }
            }

            fs.writeFileSync('tests/node/waves-devnet.conf', configFile, 'utf-8');*/

    }

    ctx.nodePid = spawn('java', ['-jar', 'waves.jar', 'waves-devnet.conf'], {
      env: process.env,
      stdio: 'ignore',
      cwd: 'tests/node'
    });


    await Promise.delay(20000);
  });

  after(async () => {
    mongoose.disconnect();
    await ctx.amqp.instance.close();
    await ctx.checkerPid.kill();
  });


  describe('block', () => blockTests(ctx));

  describe('performance', () => performanceTests(ctx));

  describe('features', () => featuresTests(ctx));

  describe('fuzz', () => fuzzTests(ctx));

});
