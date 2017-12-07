const Bytebuffer = require('bytebuffer'),
  curve25519 = require('axlsign'),
  Base58 = require('base58-native');

module.exports = {
  signatureDataTransfer: (senderPublicKey, recipientAddress, assetId = null, feeId = null, feeFlag = 0, amount, fee, timestamp, attachment = []) => {

    let typeBytes = new Bytebuffer()
      .writeByte(4)
      .flip()
      .toArrayBuffer();

    let timestampBytes = new Bytebuffer(timestamp.toString().length)
      .writeLong(timestamp)
      .flip()
      .toArrayBuffer();

    let amountAssetFlagBytes = new Bytebuffer()
      .writeByte(assetId ? 1 : 0)
      .flip()
      .toArrayBuffer();

    let amountBytes = new Bytebuffer()
      .writeLong(amount)
      .flip()
      .toArrayBuffer();

    let assetIdBytes = assetId ? Base58.decode(assetId) : [];

    let feeAssetFlagBytes = new Bytebuffer()
      .writeByte(feeFlag) //waves
      .flip()
      .toArrayBuffer();

    let feeIdBytes = feeId ? Base58.decode(feeId) : [];

    let feeBytes = new Bytebuffer()
      .writeLong(fee)
      .flip()
      .toArrayBuffer();

    let attachmentLength = new Bytebuffer()
      .writeShort(attachment.length)
      .flip()
      .toArrayBuffer();

    let decodePublicKey = Base58.decode(senderPublicKey);
    let decodeRecipient = Base58.decode(recipientAddress);



    return Bytebuffer.concat([
      typeBytes, decodePublicKey,
      amountAssetFlagBytes, assetIdBytes,
      feeAssetFlagBytes, feeIdBytes,
      timestampBytes,
      amountBytes,
      feeBytes,
      decodeRecipient,
      attachmentLength, attachment]).buffer;
  },
  signatureDataIssue: (senderPublicKey, name, description, quantity, decimals, isReissuable, fee, timestamp) => {

    let typeBytes = new Bytebuffer()
      .writeByte(3)
      .flip()
      .toArrayBuffer();

    let nameBytes = Buffer.from(name);
    let nameBytesLength = new Bytebuffer()
      .writeShort(nameBytes.length)
      .flip()
      .toArrayBuffer();

    let descriptionBytes = Buffer.from(description);
    let descriptionBytesLength = new Bytebuffer()
      .writeShort(descriptionBytes.length)
      .flip()
      .toArrayBuffer();

    let quantityBytes = new Bytebuffer()
      .writeLong(quantity)
      .flip()
      .toArrayBuffer();

    let decimalsBytes = new Bytebuffer()
      .writeByte(decimals)
      .flip()
      .toArrayBuffer();

    let isReissuableBytes = new Bytebuffer()
      .writeByte(isReissuable)
      .flip()
      .toArrayBuffer();

    let feeBytes = new Bytebuffer()
      .writeLong(fee)
      .flip()
      .toArrayBuffer();

    let timestampBytes = new Bytebuffer(timestamp.toString().length)
      .writeLong(timestamp)
      .flip()
      .toArrayBuffer();


    let decodePublicKey = Base58.decode(senderPublicKey);


    return Bytebuffer.concat([
      typeBytes, decodePublicKey, nameBytesLength, nameBytes,
      descriptionBytesLength, descriptionBytes, quantityBytes,
      decimalsBytes, isReissuableBytes, feeBytes, timestampBytes
    ]).buffer;
  },
  sign: (privateKey, dataToSign) => {
    let rawPrivateKey = Base58.decode(privateKey);
    let signatureArrayBuffer = curve25519.sign(rawPrivateKey, dataToSign);
    return Base58.encode(new Uint8Array(signatureArrayBuffer));
  }
};
