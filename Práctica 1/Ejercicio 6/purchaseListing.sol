// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract PurchaseListing is Ownable {

    IERC721 public nftContract;
    uint256 public nftId;
    uint256 public price;
    address public sellerAddress;
    address public buyerAddress;


    event NFTPurchased(address buyer, uint256 nftId, uint256 price);

    constructor(
        address _nftContract,
        uint256 _nftId,
        uint256 _price,
        address _sellerAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        nftContract = IERC721(_nftContract);
        nftId = _nftId;
        price = _price;
        sellerAddress = _sellerAddress;

    }

    // Function to buy the NFT
    function buyNFT() external payable {
        require(msg.value == price, "Funds are not the exact price to purchase the NFT");
        nftContract.safeTransferFrom(sellerAddress, msg.sender, nftId);
        payable(sellerAddress).transfer(msg.value);
        buyerAddress=msg.sender;
        emit NFTPurchased(msg.sender, nftId, price);
    }
}