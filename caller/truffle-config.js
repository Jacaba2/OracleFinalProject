const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require('fs');
const path = require('path')
const { join } = require('path')

module.exports = {
  networks: {
    developement:{
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
    sepolia: {
      provider: () => new HDWalletProvider({
      mnemonic: {
      phrase: "spice then february index pelican mosquito cruel swift energy addict truly notable"
      },
      providerOrUrl: "wss://sepolia.infura.io/ws/v3/692bfe2cc11f46cf8dd2847cd8c74910"
      }),
      network_id: 11155111, // Sepolia's network ID
      gas: 4000000, // Adjust the gas limit as per your requirements
      gasPrice: 10000000000, // Set the gas price to an appropriate value
      confirmations: 2, // Set the number of confirmations needed for a transaction
      timeoutBlocks: 200, // Set the timeout for transactions
      skipDryRun: true // Skip the dry run option
     }
  },
  compilers: {
    solc: {
      version: '0.8.3'
    }
  }
}
