const providerService = require('../../services/providerService'),
  _ = require('lodash');

module.exports = async (address, tx) => {

  const provider = await providerService.get();

  const balances = {
    balance: await provider.getBalanceByAddress(address)
  };

  if (tx && !tx.assetId)
    return balances;

  let assets = await provider.getAssetBalanceByAddress(address);

  assets = _.chain(assets)
    .map(asset => {
      let assetDefinition = _.get(asset, 'issueTransaction', {});
      return {
        name: assetDefinition.name,
        id: assetDefinition.assetId,
        decimals: assetDefinition.decimals,
        balance: asset.balance
      };
    })
    .filter(asset => asset.id)
    .value();

  balances.assets = _.transform(assets, (result, asset) => {
    result[asset.name] = {
      balance: asset.balance,
      id: asset.id,
      decimals: asset.decimals
    };
  }, {});

  return balances;

};
