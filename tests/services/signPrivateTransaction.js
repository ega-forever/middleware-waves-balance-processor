/**
 * 
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const Bytebuffer = require('bytebuffer'),
  curve25519 = require('axlsign'),
  Base58 = require('base58-native'),
  _ = require('lodash');



const signatureData = (tx) => {
     
  let typeBytes = new Bytebuffer()
    .writeByte(tx.type)
    .flip()
    .toArrayBuffer();

  let timestampBytes = new Bytebuffer(tx.timestamp.toString().length)
    .writeLong(tx.timestamp)
    .flip()
    .toArrayBuffer();

  let amountAssetFlagBytes = new Bytebuffer()
    .writeByte(tx.assetFlag || 0) //waves
    .flip()
    .toArrayBuffer();

  let amountBytes = new Bytebuffer()
    .writeLong(tx.amount)
    .flip()
    .toArrayBuffer();

  let assetIdBytes = tx.assetId ? Base58.decode(tx.assetId) : [];

  const feeFlag = tx.assetId ? 1 : 0;
  let feeAssetFlagBytes = new Bytebuffer()
    .writeByte(feeFlag) //waves
    .flip()
    .toArrayBuffer();

  
  let feeIdBytes = tx.assetId ? Base58.decode(tx.assetId) : [];
  let feeBytes = new Bytebuffer()
    .writeLong(tx.fee)
    .flip();

  const attachment = tx.attachment || [];
  let attachmentLength = new Bytebuffer()
    .writeShort(attachment.length)
    .flip()
    .toArrayBuffer();

  let decodePublicKey = Base58.decode(tx.senderPublicKey);
  let decodeRecipient = Base58.decode(tx.recipient);


  return Bytebuffer.concat([
    typeBytes, 
    decodePublicKey,
    amountAssetFlagBytes, assetIdBytes,
    feeAssetFlagBytes, feeIdBytes,
    timestampBytes,
    amountBytes,
    feeBytes,
    decodeRecipient,
    attachmentLength, attachment]).buffer;
};

const sign = (privateKey, dataToSign) => {
  let rawPrivateKey = Base58.decode(privateKey);
  let signatureArrayBuffer = curve25519.sign(rawPrivateKey, dataToSign);
  return Base58.encode(new Uint8Array(signatureArrayBuffer));
};



module.exports = (privateKey, tx) => {
  return _.merge(tx, {
    signature: sign(privateKey, signatureData(tx))
  });
};
