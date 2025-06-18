// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

struct Item {
    uint itemId;
    IERC721 nftAddress;
    uint tokenID;
    uint price;
    address payable seller;
    bool isSold;

}
contract Marketplace is ReentrancyGuard{
    uint public immutable feePercent;
    address payable public immutable feeAccount;
    uint public itemCount;
    mapping (uint => Item) public items;
    event ItemAdded(uint itemId, address payable indexed seller, IERC721 indexed nft, uint tokenId, uint price);
    event ItemSold(uint itemId, address payable indexed seller, address indexed buyer, IERC721 indexed nft, uint tokenId, uint price);
    constructor(uint _feePercent){
        feePercent= _feePercent;
        feeAccount = payable(msg.sender);
    }
    function addItem(IERC721 nftAddress, uint tokenId, uint price) external nonReentrant{
        require(price > 0, "Price should be greater than 0");
        nftAddress.transferFrom(msg.sender,address(this),tokenId);
        itemCount++;
        items[itemCount] = Item(
            itemCount,
            nftAddress,
            tokenId,
            price,
            payable(msg.sender),
            false
        );
        emit ItemAdded(itemCount,payable(msg.sender),nftAddress,tokenId,price);
    }
    function getPrice(uint itemId) public view returns (uint){
        return items[itemId].price;
    }
    function purchaseItem(uint itemId) external payable nonReentrant{
        require(itemId > 0 && itemId <= itemCount,"Item id invalid");
        require(msg.value==items[itemId].price, "Invalid Price");
        Item storage item = items[itemId];
        require(!item.isSold, "Item already sold");
        item.nftAddress.transferFrom(address(this),msg.sender,item.tokenID);
        uint transferAmount = item.price*(100-feePercent)/100;
        (bool sentToSeller,)=item.seller.call{value:transferAmount}("");
        (bool sentToFeeAccount,)=payable(feeAccount).call{value:item.price-transferAmount}("");
        require(sentToSeller && sentToFeeAccount, "Failed to send ether");
        item.isSold=true;
        emit ItemSold(itemId,item.seller,msg.sender,item.nftAddress,item.tokenID,item.price);
    }
}