pragma solidity ^0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Auction is Ownable {
    IERC721 public nftContract;
    uint256 public nftId;
    address public beneficiaryAddress;
    uint public auctionCloseTime;

    address public topBidder;
    uint public topBid;

    mapping(address => uint) returnsPending;
    bool auctionComplete;

    event topBidIncreased(address bidder, uint bidAmount);
    event auctionResult(address winner, uint bidAmount);

    constructor(
        address _nftContract,
        uint256 _nftId,
        uint _biddingTime,
        address _beneficiary,
        address initialOwner
    ) Ownable(initialOwner) {
        nftContract = IERC721(_nftContract);
        nftId = _nftId;
        beneficiaryAddress = _beneficiary;
        auctionCloseTime = block.timestamp + _biddingTime;
    }

    function bid(uint amount) external payable virtual {
        require(block.timestamp <= auctionCloseTime, "Auction already closed");
        require(amount > topBid, "There already is a higher bid");

        if (topBidder != address(0)) {
            returnsPending[topBidder] += topBid;
        }
        topBidder = msg.sender;
        topBid = amount;
        emit topBidIncreased(msg.sender, amount);
    }

    function withdraw() external returns (bool) {
        uint bidAmount = returnsPending[msg.sender];
        if (bidAmount > 0) {
            returnsPending[msg.sender] = 0;
            if (!payable(msg.sender).send(bidAmount)) {
                returnsPending[msg.sender] = bidAmount;
                return false;
            }
        }
        return true;
    }

    function closeAuction() external onlyOwner {
        require(block.timestamp >= auctionCloseTime, "Auction not yet ended");
        require(!auctionComplete, "closeAuction has already been called");

        auctionComplete = true;
        emit auctionResult(topBidder, topBid);

        nftContract.safeTransferFrom(beneficiaryAddress, topBidder, nftId);
        payable(beneficiaryAddress).transfer(topBid);
    }
}

contract PublicAuction is Auction {
    constructor(
        address _nftContract,
        uint256 _nftId,
        uint _biddingTime,
        address _beneficiary,
        address initialOwner
    ) Auction(_nftContract, _nftId, _biddingTime, _beneficiary, initialOwner) {}
}

contract PrivateAuction is Auction {
    mapping(address => bool) authorizedUsers;

    constructor(
        address _nftContract,
        uint256 _nftId,
        uint _biddingTime,
        address _beneficiary,
        address initialOwner,
        address[] memory _authorizedUsers
    ) Auction(_nftContract, _nftId, _biddingTime, _beneficiary, initialOwner) {
        for (uint i = 0; i < _authorizedUsers.length; i++) {
            authorizedUsers[_authorizedUsers[i]] = true;
        }
    }

    function authorizeUser(address user) external onlyOwner {
        authorizedUsers[user] = true;
    }

    function bid(uint amount) external payable override {
        require(authorizedUsers[msg.sender], "You are not authorized to participate in this auction");
        require(block.timestamp <= auctionCloseTime, "Auction already closed");
        require(amount > topBid, "There already is a higher bid");

        if (topBidder != address(0)) {
            returnsPending[topBidder] += topBid;
        }
        topBidder = msg.sender;
        topBid = amount;
        emit topBidIncreased(msg.sender, amount);
    }
}