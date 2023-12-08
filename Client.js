const common = require('./utils/common.js')
require('./EthPriceOracle')
const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 2000
const PRIVATE_KEY_FILE_NAME = process.env.PRIVATE_KEY_FILE || './caller/caller_private_key'
const CallerJSON = require('./caller/build/contracts/CallerContract.json')
const OracleJSON = require('./oracle/build/contracts/EthPriceOracle.json')
const {Web3} = require('web3')
const ganacheUrl = 'ws://localhost:7545';
const wsProvider = new Web3.providers.WebsocketProvider(ganacheUrl);
const web3js = new Web3(wsProvider);
require("dotenv").config();

//retrieves info for caller contract
async function getCallerContract (web3js, networkId) {
  return new web3js.eth.Contract(CallerJSON.abi, CallerJSON.networks[networkId].address)
}

//Watches for events fired from oracle contract and carries out tasks based on the events
async function filterEvents (callerContract) {
  
  callerContract.getPastEvents('PriceUpdatedEvent', {
    fromBlock: 'latest',
    toBlock: 'latest'
  }).then(
    function(events){
      events.forEach(event => {
        console.log('* New PriceUpdated event. ethPrice: ' + event.returnValues.ethPrice)
      })
    }
  )
  callerContract.events.ReceivedNewRequestIdEvent({ filter: { } }, async (err, event) => {
    if (err) console.error('Error on event', err)
  })
}

//initalized vairables of main function below
async function init () {
  const networkId = await web3js.eth.net.getId()
  const ownerAddress = process.env.OWNER_ADDRESS
  const callerContract = await getCallerContract(web3js, networkId)
  return { callerContract, ownerAddress, web3js, networkId }
}

//main function
(async () => {
  const { callerContract, ownerAddress, web3js, networkId} = await init()

  const oracleAddress = OracleJSON.networks[networkId].address
  await callerContract.methods.setOracleInstanceAddress(oracleAddress).send({ from: ownerAddress })
  
  setInterval( async () => {
    await filterEvents(callerContract)
    await callerContract.methods.updateEthPrice().send({ from: ownerAddress, gas: '1000000' })
  }, SLEEP_INTERVAL);

})()
