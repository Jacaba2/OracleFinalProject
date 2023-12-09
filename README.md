# Intro to Smart Contract Final Project
## By Albert Cho, Alex Campbell, Ha Trang Mai

#### Introduction:
For this project, we were able to build Oracle using Visual Studios code. We were able to create a smart contract project using truffle to test and deploy our codes. This project allowed us to deploy our contract to a local blockchain instance using Ganache and deploy it into the Ethereum testnets. 

#### What it currently does:
1.a Owner node sends command to truffle to deploy contracts onto blockchain.

1.b Truffle config and the migration scripts are used to initialize these contracts and help deploy them

1.c 2 JSON flies are created. These are the contracts ABI’s. The ABI’s allow us to communicate with the contracts on the blockchain with the rest of our script. We use web3 to connect all the interactions between the javascript and solidity contracts

2. User starts script by typing node client.js into terminal window
3. User account information is retrieved from the utils/common.js file along with the information of the testdev network and the private key of the accounts. Currently, this is the spot where I am struggling to get things working. For the cryptozombies example, this script used loom test-net also called extdev. I attempted to use this same service, but it cost money. I have attempted to use ganache to deploy the smart contract but have run into a few bugs which I will show in the following slides.

3.5 The first thing this the javascript calls for is for the caller contract to run the function “setOracleInstanceAddress.” This creates a new oracle node. This oracle is used to retrieve the data. 

4. From this point on, the contract is running in a continuous loop of fetching data every “SLEEP_INTERVAL” ms and returning that data. This is done by calling “updateEthPrice()” in the caller contract.
   
5. updateEthPrice() created a request ticket id and emits that data to EthPriceOracle.js and to the oracle contract. This then sends a the ticket id to EthPriceOracle.sol to process the request. This calls “getLatestEthPrice().”
   
6. Oracle send out event to “retrieveLatestEthPrice()”
    
7. Client.js fetches data from website API to retrieve data for latest Eth Price.
  
8. This data is now transmitted back to the Oracle Contract where it is then processed and sent back to the .
    
9. Caller contract send data back through its callback function and emits event “PriceUpdatedEvent” that sends finalized data to client.js
    
10. Client.js receives data and logs the data onto the console log. This process is now repeated from step 4


#### Program Explanation:
CallerContract.sol: This contract allows users to request random numbers and emit them in the events. The Caller contract primary function is to trigger the Oracle contract’s functionalities, like requesting data from external sources and handling the received information.

OracleContract.sol: The Oracle contract retrieves data from external sources through APIs, external adapters, or trusted off-chain services. An Oracle contract in Solidity serves as a bridge between the blockchain and the external world. Its primary function is to enable smart contracts to access information that exists outside the blockchain, such as market prices, weather updates, sports scores, etc.

Script/gen-key.js: This contract when executed from the command line, it generates a private key and saves it to the specified file. It also can be used for cryptographic operations or other purposes in applications requiring secure key management.

Utils/common.js: The exported ‘loadAccount’ function sums up the setup required to load an account for interacting with the specified chain using Loom Network's tools and utilities. It configures the necessary middleware and provides a ‘Web3’ instance connected via a 'LoomProvider’ that allows interaction with the blockchain using the loaded account.

Client.js: It loads an account using the ‘loadAccount’ function from the ‘common.js’ file, which reads a private key file to set up a web3 provider and client. Client.js interaction with smart contract is it retrieves the network ID and oracle address from the JSON files, calls the ‘setOracleInstanceAddress’ method of callerContract to set the address of the Oracle instance, and sets an interval to periodically call the updateEthPrice method of callerContract, updating the Ethereum price at regular intervals based on the specified sleep interval.

EthPriceOracle.js: There is a backend service hitting the Binance API for the current ETH/USD price and submitting that to this contract. The client consistently sends requests to the blockchain at set intervals, while the backend service processes these requests in batches within a queue, also on a scheduled interval. This setup ensures a continuous update of Ethereum's value in USD on the blockchain by regularly querying the Binance API and syncing the value within the specified time frame.

### Steps to interact with project:

#### Prerequisites:
1)	Install Visual studio Code
a.	In VSC extensions download solidity, JavaScript (ES6), JavaScript Debugger, Node.js Modules, Command Pallet NPM 
2)	Install Node.js
3)	Download Github folder to computer
4)	Download Ganache UI
	
#### Getting set up:
1)	Open project in VSC (File -> Open Folder)
2)	In cmd, navigate to your project directory (cd ./FolderLocation/EthPriceOracle) and type the following:
a.	npm install web3
b.	npm install web3-providers-ws
c.	npm install @truffle/hdwallet-provider
d.	npm install axios
e.	npm install bn.js
f.	npm install dotenv
g.	npm install truffle

#### Ganache UI:
a.	Create a new project Ganache UI Blockchain and make the local address is HTTP://127.0.0.1:7545
b.	Navigate to the “contract” tab and add both truffle-config.js files into the project. Save these changes. 
c.	Go back to the “Address” tab and copy the first address and paste it into the value for “OWNER_ADDRESS” in the .env file
d.	Copy the second address and paste it into the “ORACLE_ADDRESS” in the .env file
e.	Repeat steps c and d in the oracle/migration/2_eth_price_oracle.js file. The first address is the owner, the second address is the oracle

#### Truffle – deploying smart contracts:
a.	In the cmd, make sure you are navigated to the project directory
b.	Type in npm run deploy:local. If everything worked, you should be able to see 2 transactions taken from your first account in ganache. These are the transactions of you deploying your 2 smart contracts.
i.  If everything worked correctly, this could produce 4 JSON files in contracts/build for each contract folder (/oracle and /caller) 

#### Running the project:
a.	In VSC, go ahead click run -> run without Debugging
i.	If all is working correctly, you should see “* New PriceUpdated event. ethPrice: 12345600000000000.”

###### Note: In “EthPriceOracle.js” ethPrice is only being set to “12345600…” just as a test. We attempted to use an API to retrieve a value but had difficulties with using both axios and the fetch function. 
