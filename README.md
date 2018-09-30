# middleware-waves-balance-processor [![Build Status](https://travis-ci.org/ChronoBank/middleware-waves-balance-processor.svg?branch=master)](https://travis-ci.org/ChronoBank/middleware-waves-balance-processor)

Middleware service for handling user balance

### Installation

This module is a part of middleware services. You can install it in 2 ways:

1) through core middleware installer  [middleware installer](https://github.com/ChronoBank/middleware)
2) by hands: just clone the repo, do 'npm install', set your .env - and you are ready to go

##### About
This module is used for updating balances for the specified addresses (see a description of addresses manipulation in [rest module](https://github.com/ChronoBank/middleware-waves-rest)).

#### How does it work?

Block processor send message about transaction through rabbitmq to this middleware. Then middleware update balance and assets
for changed accounts. After middleware send message throught rabbitmq with the following format:

```
{ address: '3JfE6tjeT7PnpuDQKxiVNLn4TJUFhuMaaT5',
 balance: '1028000004216500',
 assets: { '8V15mJPWMiriHQZwrjLGAoQNP84yutotnSmVrFKBGFtZ': 10000000 },
 tx: { 
    type: 4,
    id: 'FBrL9hxvTivF6o4RS6vP7UKsUyHcEFS5bZLph7o6C8Qk',
    sender: '3JfE6tjeT7PnpuDQKxiVNLn4TJUFhuMaaT5',
    senderPublicKey: 'GbGEY3XVc2ohdv6hQBukVKSTQyqP8rjQ8Kigkj6bL57S',
    fee: 100000,
    timestamp: 1528221884910,
    signature: '56FFotc1da4wr4SrGZ85qGH3E9XrbVawyUVQGF3HWcZfmZw5PQLkgYPDZWcp45xseU1Sr2RjLt6WHrPXf7imgGz5',
    recipient: '3Jk2fh8aMBmhCQCkBcUfKBSEEa3pDMkDjCr',
    assetId: null,
    amount: 100,
    feeAsset: null,
    attachment: 'string',
    blockNumber: 4925,
    hash: '56FFotc1da4wr4SrGZ85qGH3E9XrbVawyUVQGF3HWcZfmZw5PQLkgYPDZWcp45xseU1Sr2RjLt6WHrPXf7imgGz5',
    address: '3JfE6tjeT7PnpuDQKxiVNLn4TJUFhuMaaT5' 
 } 
}
```



##### сonfigure your .env

To apply your configuration, create a .env file in root folder of repo (in case it's not present already).
Below is the expamle configuration:

```
MONGO_ACCOUNTS_URI=mongodb://localhost:27017/data
MONGO_ACCOUNTS_COLLECTION_PREFIX=waves
RABBIT_URI=amqp://localhost:5672
RABBIT_SERVICE_NAME=app_waves
NETWORK=development
RPC=http://localhost:6869
BLOCK_GENERATION_TIME=60
```

The options are presented below:

| name | description|
| ------ | ------ |
| MONGO_URI   | the URI string for mongo connection
| MONGO_COLLECTION_PREFIX   | the default prefix for all mongo collections. The default value is 'waves'
| MONGO_ACCOUNTS_URI   | the URI string for mongo connection, which holds users accounts (if not specified, then default MONGO_URI connection will be used)
| MONGO_ACCOUNTS_COLLECTION_PREFIX   | the collection prefix for accounts collection in mongo (If not specified, then the default MONGO_COLLECTION_PREFIX will be used)
| RABBIT_URI   | rabbitmq URI connection string
| RABBIT_SERVICE_NAME   | namespace for all rabbitmq queues, like 'app_waves_transaction'
| NETWORK   | network name (alias)- is used for connecting via http node (see block processor section)
| RPC   | the path to waves rest api for get balance for user
| BLOCK_GENERATION_TIME | generation time for block
| SYSTEM_RABBIT_URI   | rabbitmq URI connection string for infrastructure
| SYSTEM_RABBIT_SERVICE_NAME   | rabbitmq service name for infrastructure
| SYSTEM_RABBIT_EXCHANGE   | rabbitmq exchange name for infrastructure
| CHECK_SYSTEM | check infrastructure or not (default = true)
| CHECK_WAIT_TIME | interval for wait respond from requirements

License
----
 [GNU AGPLv3](LICENSE)

Copyright
----
LaborX PTY
