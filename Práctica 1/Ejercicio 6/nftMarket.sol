// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.10;

import "./purchaseListing.sol";
import "./auction.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTMarket is Ownable {

    mapping(uint256 => PurchaseListing) public listings;
    mapping(uint256 => address) public auctions;

    event AuctionCreated(address auctionContract, uint256 nftId);
    event NFTListedForSale(address seller, uint256 nftId, uint256 price);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function createPublicAuction(
        address _nftContract,
        uint256 _nftId,
        uint _biddingTime,
        address _beneficiary
    ) external onlyOwner {
        PublicAuction auction = new PublicAuction(_nftContract, _nftId, _biddingTime, _beneficiary, msg.sender);
        auctions[_nftId] = address(auction);
        emit AuctionCreated(address(auction), _nftId);
    }

    function createPrivateAuction(
        address _nftContract,
        uint256 _nftId,
        uint _biddingTime,
        address _beneficiary
    ) external onlyOwner {
        PrivateAuction auction = new PrivateAuction(_nftContract, _nftId, _biddingTime, _beneficiary, msg.sender);
        auctions[_nftId] = address(auction);
        emit AuctionCreated(address(auction), _nftId);
    }

    function transferNFT(
        address _nftContract,
        uint256 _nftId,
        address _to
    ) external onlyOwner {
        IERC721(_nftContract).safeTransferFrom(msg.sender, _to, _nftId);
    }

    function listNFTForSale(
        address _nftContract,
        uint256 _nftId,
        uint256 _price,
        address _sellerAddress
    ) external {
        PurchaseListing listing = new PurchaseListing(_nftContract, _nftId, _price, _sellerAddress, msg.sender);
        listings[_nftId] = listing;

        emit NFTListedForSale(msg.sender, _nftId, _price);
    }
    
}

