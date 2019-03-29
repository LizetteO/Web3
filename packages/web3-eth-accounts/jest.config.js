const jestConfig = require('../../jest.config');

module.exports = jestConfig({
    'Utils': 'web3-utils',
    'isHexStrict': 'web3-utils',
    'hexToBytes': 'web3-utils',
    'formatters': 'web3-core-helpers',
    'EthAccount': 'eth-lib/lib/account',
    'scryptsy': 'scrypt.js'
});
