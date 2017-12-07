const sign = require('./signature'),
  _ = require('lodash');

module.exports = {
  transfer: (toAddress, amount, fee, account, assetId) => {

    let tx = {
      assetId: assetId,
      senderPublicKey: account.publicKey,
      recipient: toAddress,
      fee: fee,
      amount: amount,
      timestamp: Date.now()
    };

    let signature = sign.signatureDataTransfer(
      tx.senderPublicKey, tx.recipient,
      tx.assetId, null, 0,
      tx.amount, tx.fee, tx.timestamp);

    let signedSignature = sign.sign(account.privateKey, signature);
    return _.merge({signature: signedSignature}, tx);

  },
  asset: (name, description, account, fee, decimals, quantity, reissuable) => {

    let tx = {
      name: name,
      description: description,
      sender: account.address,
      senderPublicKey: account.publicKey,
      fee: fee,
      decimals: decimals,
      quantity: quantity,
      reissuable: reissuable,
      timestamp: Date.now()
    };

    let signature = sign.signatureDataIssue(
      tx.senderPublicKey, tx.name,
      tx.description, tx.quantity, tx.decimals, tx.reissuable ? 1 : 0,
      tx.fee, tx.timestamp);

    let signedSignature = sign.sign(account.privateKey, signature);
    return _.merge({signature: signedSignature}, tx);

  }
};
