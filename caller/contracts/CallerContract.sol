// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;
import "./EthPriceOracleInterface.sol";
import "./Ownable.sol";
contract CallerContract is Ownable {

  //initalizing vairable
  uint256 private ethPrice;
  EthPriceOracleInterface private oracleInstance; //initalizing oracle instance utililzing EthPriceOracleInterface.sol
  address private oracleAddress; //initalizing oracle address name

  mapping(uint256=>bool) myRequests; // mapping myRequests from a generated ID to a yes or no output to determine if this address has a request

  //initalizing events so front end can be notified of what actions to take
  event newOracleAddressEvent(address oracleAddress); 
  event ReceivedNewRequestIdEvent(uint256 id);
  event PriceUpdatedEvent(uint256 ethPrice, uint256 id);
  
  //Allows user to link Caller Contract with Oracle Contract
  function setOracleInstanceAddress (address _oracleInstanceAddress) public onlyOwner {
    oracleAddress = _oracleInstanceAddress; 
    oracleInstance = EthPriceOracleInterface(oracleAddress);
    emit newOracleAddressEvent(oracleAddress);
  }

  //Function to call for Ether Price to be updeated.
  function updateEthPrice() public {
    uint256 id = oracleInstance.getLatestEthPrice();//utilized oracle interface to call for get ether price
    myRequests[id] = true; // Creates an map using the id recieved from the oracle contract and flags it as true
    emit ReceivedNewRequestIdEvent(id);
  }
  //callback function only accessable from oracle. Is the called back request from oracle contract to update the price of ether
  function callback(uint256 _ethPrice, uint256 _id) public onlyOracle {
    require(myRequests[_id], "This request is not in my pending list.");
    ethPrice = _ethPrice;
    delete myRequests[_id];
    emit PriceUpdatedEvent(_ethPrice, _id);
  }
  
  //Modifer for callback function so it can only be access if it is the oracle Address
  modifier onlyOracle() {
    require(msg.sender == oracleAddress, "You are not authorized to call this function.");
    _;
  }
}
