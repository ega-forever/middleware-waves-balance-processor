const requests = require('../services/nodeRequests'),
    Promise = require('bluebird'),
    config = require('../config');


module.exports = async (name, sender) => {
    const tx = await requests.signIssueTransaction(config.dev.apiKey, name, name, sender, 
        100000000, 3, 10000000, false);
    await requests.sendIssueTransaction(config.dev.apiKey, tx);
    await new Promise(res => {
        const check = async () => {
            const initBalance = await requests.getBalanceByAddressAndAsset(sender, tx.assetId);
            if (initBalance > 0) 
                return res();
            else {
                await Promise.delay(3000);
                return check();
            }
        }
        check();
    });
    return tx.assetId;
}