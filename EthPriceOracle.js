const BN = require('bn.js') //Big number library
const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 2000
const PRIVATE_KEY_FILE_NAME = process.env.PRIVATE_KEY_FILE || './oracle/oracle_private_key' // private key location
const CHUNK_SIZE = process.env.CHUNK_SIZE || 3 
const MAX_RETRIES = process.env.MAX_RETRIES || 5
const OracleJSON = require('./oracle/build/contracts/EthPriceOracle.json') //EtherPriceOracle ABI

const {Web3} = require('web3')
const ganacheUrl = 'ws://localhost:7545';
const wsProvider = new Web3.providers.WebsocketProvider(ganacheUrl);
const web3js = new Web3(wsProvider);
require("dotenv").config();
var pendingRequests = []

//Gets Oracle contract Id utilizing web3. This is done so contract can be viewed once deployed
async function getOracleContract (web3js) {
  const networkId = await web3js.eth.net.getId()
  return new web3js.eth.Contract(OracleJSON.abi, OracleJSON.networks[networkId].address)
}

//Watches for events fired from oracle contract and carries out tasks based on the events
async function filterEvents (oracleContract, web3js) {

  oracleContract.getPastEvents('GetLatestEthPriceEvent', {
    fromBlock: 'latest',
    toBlock: 'latest'
  }).then(
    function(events){
      events.forEach(event => {
        addRequestToQueue(event)
      });
    }
  );

  oracleContract.events.SetLatestEthPriceEvent(async (err, event) => {
    if (err) {
      console.error('Error on event', err)
      return
    }
    // Do something
  })
}

//if specified event is emitted, add that request to the queue with the caller address and id of request
async function addRequestToQueue (event) {
  const callerAddress = event.returnValues.callerAddress
  const id = event.returnValues.id
  pendingRequests.push({ callerAddress, id })
}

//Removes first object in queue and shuffles data in queue. 
async function processQueue (oracleContract, ownerAddress) {
  let processedRequests = 0
  while (pendingRequests.length > 0 && processedRequests < CHUNK_SIZE) {
    const req = pendingRequests.shift()
    await processRequest(oracleContract, ownerAddress, req.id, req.callerAddress)
    processedRequests++
  }
}

//Carries out task to recieve latest ether price
async function processRequest (oracleContract, ownerAddress, id, callerAddress) {
  let retries = 0
  while (retries < MAX_RETRIES) {
    try {
      const ethPrice = await retrieveLatestEthPrice()
      await setLatestEthPrice(oracleContract, callerAddress, ownerAddress, ethPrice, id)
      return
    } catch (error) {
      if (retries === MAX_RETRIES - 1) {
        await setLatestEthPrice(oracleContract, callerAddress, ownerAddress, '0', id)
        return
      }
      retries++
    }
  }
}

//fetches latest ether price form API
async function retrieveLatestEthPrice () {
  
  const options = {
    headers: {
      'x-access-token': 'coinranking84143d427d79aedad184663a6001b2a1369076ed43a01a3f',
    },
  };
  const response = await fetch('https://api.coinranking.com/v2/coin/Qwsogvtv82FCd/price', options)
  const result = await response.json()

  return result.data.price
}

//formats ether price data to be sent back to oracle contract
async function setLatestEthPrice (oracleContract, callerAddress, ownerAddress, ethPrice, id) {
  const multiplier = new BN(10**10, 10)
  const ethPriceInt = (new BN(parseInt(ethPrice), 10)).mul(multiplier)
  const idInt = new BN(parseInt(id))
  const oracleAddress = process.env.ORACLE_ADDRESS

  try {
    await oracleContract.methods.setLatestEthPrice(ethPriceInt.toString(), callerAddress, idInt.toString()).send({ from: oracleAddress, gas: '1000000' })
  } catch (error) {
    console.log('Error encountered while calling setLatestEthPrice.')
    // Do some error handling
  }
}

//initalization of main function
async function init () {
  const ownerAddress = process.env.OWNER_ADDRESS
  const oracleContract = await getOracleContract(web3js)
  return { oracleContract, ownerAddress}
}

//main function
(async () => {
  const { oracleContract, ownerAddress } = await init()

  setInterval(async () => {
    await filterEvents(oracleContract, web3js)
    await processQueue(oracleContract, ownerAddress)
  }, SLEEP_INTERVAL)
})()
