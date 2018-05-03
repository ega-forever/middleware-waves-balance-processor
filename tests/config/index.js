/**
 * 
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const config = require('../../config');


config['dev'] = {
  'apiKey': 'password',
  'accounts':  [
    process.env.ACCOUNT_ONE  || '3JfE6tjeT7PnpuDQKxiVNLn4TJUFhuMaaT5',
    process.env.ACCOUNT_TWO  || '3Jk2fh8aMBmhCQCkBcUfKBSEEa3pDMkDjCr'
  ],
  privateKeys: [
    process.env.PRIVATE_KEY_ONE || 'FYLXp1ecxQ6WCPD4axTotHU9RVfPCBLfSeKx1XSCyvdT',
    process.env.PRIVATE_KEY_TWO || 'EXKwLZybgit3uKddrMDNBXXES4P2prUmMPqHMWpyY1V5',
  ],
  publicKeys: [
    process.env.PUBLIC_KEY_ONE || 'GbGEY3XVc2ohdv6hQBukVKSTQyqP8rjQ8Kigkj6bL57S',
    process.env.PUBLIC_KEY_TWO || '3tWuqg9syHTsdmNNmwUbguLUhnpyE5AS4rpkojgm6aw2',
  ]
};

module.exports = config;
