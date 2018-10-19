/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
require('dotenv').config();
const config = require('../../config');

config.dev = {
 // apiKey: 'ridethewaves!',
  apiKey: 'password',
  providerForTest: process.env.PROVIDER_FOR_TEST || 'http://localhost:6869',
  accounts: [
    {
      address: '3JfE6tjeT7PnpuDQKxiVNLn4TJUFhuMaaT5',
      publicKey: '3VCZnUL9xKU8Va8T6gitPD3vvZbZsS3UzfQKkUa1gmF9',
      privateKey: 'FYLXp1ecxQ6WCPD4axTotHU9RVfPCBLfSeKx1XSCyvdT'
    },
    {
      address: '3Jk2fh8aMBmhCQCkBcUfKBSEEa3pDMkDjCr',
      publicKey: '3VCZnUL9xKU8Va8T6gitPD3vvZbZsS3UzfQKkUa1gmF9',
      privateKey: 'EXKwLZybgit3uKddrMDNBXXES4P2prUmMPqHMWpyY1V5'
    },
    {
      address: '3JuJRCEthv5KFLpWa1abtMDKAJSeviE2dEe',
      publicKey: 'Ad23whTEeHayioPfA5yVk5nuikXnDFSWyQhL5o9rYWfT',
      privateKey: '97i6eG8eyeqWpJRdKEvU6Nk6EsE5y9iYXbfYE8NDd2Qm'
    }
  ]
};

module.exports = config;
