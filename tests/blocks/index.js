/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const models = require('../../models'),
  sender = require('../utils/sender'),
  getUpdatedBalance = require('../../utils/balance/getUpdatedBalance'),
  waitTransaction = require('../utils/waitTransaction'),
  expect = require('chai').expect;

module.exports = (ctx) => {

  before (async () => {
    await models.accountModel.remove({});

    await models.accountModel.create({
      address: ctx.accounts[0].address,
      balance: 0,
      isActive: true
    });
  });

  it('validate after transaction getUpdatedBalance function', async () => {
    const balance  = await getUpdatedBalance(ctx.accounts[0].address);
    const tx = await waitTransaction(sender.sendTransaction.bind(sender, ctx.accounts[0].address, ctx.accounts[1].address, 10))
    const newBalance = await getUpdatedBalance(ctx.accounts[0].address);


    if (tx.sender === ctx.accounts[0].address)
      expect(newBalance.balance).to.lessThan(balance.balance);
    else 
      expect(newBalance.balance).to.greaterThan(balance.balance);


  });


  



};
