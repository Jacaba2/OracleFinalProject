// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;
import "./Roles.sol";
import "./SafeMath.sol";
import "./CallerContractInterface.sol";
contract EthPriceOracle {

  using Roles for Roles.Role;
  Roles.Role private owners;
  Roles.Role private oracles;

  using SafeMath for uint256;

  uint private randNonce = 0;
  uint private modulus = 1000;
  uint private numOracles = 1;
  uint private THRESHOLD = 1;

  mapping(uint256=>bool) pendingRequests;

  struct Response {
    address oracleAddress;
    address callerAddress;
    uint256 ethPrice;
  }
  mapping (uint256=>Response[]) public requestIdToResponse;

  event GetLatestEthPriceEvent(address callerAddress, uint id);
  event SetLatestEthPriceEvent(uint256 ethPrice, address callerAddress);
  event AddOracleEvent(address oracleAddress);
  event RemoveOracleEvent(address oracleAddress);
  event SetThresholdEvent (uint threshold);
  
  //establishes owner of contract when deployed from 2_eth_price_oracle.js
  constructor (address _owner, address _oracle) {
    owners.add(_owner);
    oracles.add(_oracle);
  }

  function addOracle(address _oracle) public {
    require(owners.has(msg.sender), "Not an owner!"); //veifying that msg.sender is an owner
    require(!oracles.has(_oracle), "Already an oracle!"); //verifying tha the oracle address has not already been added as an oracle
    oracles.add(_oracle); //adding oracle
    numOracles++;
    emit AddOracleEvent(_oracle);
  }

  function removeOracle (address _oracle) public {
    require(owners.has(msg.sender), "Not an owner!");
    require(oracles.has(_oracle), "Not an oracle!");
    require (numOracles > 1, "Do not remove the last oracle!");
    oracles.remove(_oracle);
    numOracles--;
    emit RemoveOracleEvent(_oracle);
  }

  //Setting threshold for #of responses needed to calculate Eth Price
  function setThreshold (uint _threshold) public {
    require(owners.has(msg.sender), "Not an owner!");
    require(_threshold > 0, "Threshold cannot be 0");
    THRESHOLD = _threshold;
    emit SetThresholdEvent(THRESHOLD);
  }

  //is called from EthPriceOracleInterface. Returns id which is the request id. Emits event to JS to fetch the data.
  function getLatestEthPrice() public returns (uint256) {
    randNonce++;
    uint id = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce))) % modulus;
    pendingRequests[id] = true;
    emit GetLatestEthPriceEvent(msg.sender, id);
    return id;
  }
  
  //Takes price of ether returned form client.js and 
  function setLatestEthPrice(uint256 _ethPrice, address _callerAddress, uint256 _id) public {
    require(oracles.has(msg.sender), "Not an oracle!"); //Verifies that oracle is registered
    require(pendingRequests[_id], "This request is not in my pending list."); // verifies that pending request is true
    Response memory resp; // creates instance of response called resp
    resp = Response(msg.sender, _callerAddress, _ethPrice); // sets values to the following
    requestIdToResponse[_id].push(resp); // pushes values of resp to requestIdToresponse. 
    uint numResponses = requestIdToResponse[_id].length; //finds # of reponses 
    
    if (numResponses == THRESHOLD) { // processes and updates the mean Eth price once a threshold of oracle responses have been completed.
      uint computedEthPrice = 0;
        for (uint f=0; f < requestIdToResponse[_id].length; f++) {
        computedEthPrice = computedEthPrice.add(requestIdToResponse[_id][f].ethPrice);
      }
      computedEthPrice = computedEthPrice.div(numResponses);
      delete pendingRequests[_id];
      delete requestIdToResponse[_id];
      CallerContractInterface callerContractInstance;
      callerContractInstance = CallerContractInterface(_callerAddress);
      callerContractInstance.callback(computedEthPrice, _id);
      emit SetLatestEthPriceEvent(computedEthPrice, _callerAddress);
    }
  }
}
