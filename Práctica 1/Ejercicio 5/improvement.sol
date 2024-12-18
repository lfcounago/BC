// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;
/// @title Voting with delegation.
contract Ballot {
    struct Voter {
        uint weight;
        bool voted;
        address delegate;
        uint vote;
    }

    struct Proposal {
        bytes32 name;
        uint voteCount;
    }

    address public chairperson;
    mapping(address => Voter) public voters;
    Proposal[] public proposals;

    constructor(bytes32[] memory proposalNames) {
        chairperson = msg.sender;
        voters[chairperson].weight = 1;

        for (uint i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({
                name: proposalNames[i],
                voteCount: 0
            }));
        }
    }

    function giveRightToVote(address voter) external {
        require(msg.sender == chairperson, "Only chairperson can give right to vote.");
        require(!voters[voter].voted, "The voter already voted.");
        require(voters[voter].weight == 0, "Voter already has a weight.");
        voters[voter].weight = 1;
    }

    function giveRightToVoteBatch(address[] memory votersList) external {
        require(msg.sender == chairperson, "Only chairperson can give right to vote.");
        for (uint i = 0; i < votersList.length; i++) {
            address voter = votersList[i];
            require(!voters[voter].voted, "The voter already voted.");
            require(voters[voter].weight == 0, "Voter already has a weight.");
            voters[voter].weight = 1;
        }
    }

    function delegate(address to) external {
        Voter storage sender = voters[msg.sender];
        require(sender.weight != 0, "You have no right to vote");
        require(!sender.voted, "You already voted.");
        require(to != msg.sender, "Self-delegation is disallowed.");

        while (voters[to].delegate != address(0)) {
            to = voters[to].delegate;
            require(to != msg.sender, "Found loop in delegation.");
        }

        Voter storage delegate_ = voters[to];
        require(delegate_.weight >= 1);

        sender.voted = true;
        sender.delegate = to;

        if (delegate_.voted) {
            proposals[delegate_.vote].voteCount += sender.weight;
        } else {
            delegate_.weight += sender.weight;
        }
    }

    function vote(uint proposal) external {
        Voter storage sender = voters[msg.sender];
        require(sender.weight != 0, "Has no right to vote");
        require(!sender.voted, "Already voted.");
        sender.voted = true;
        sender.vote = proposal;
        proposals[proposal].voteCount += sender.weight;
    }

    function winningProposals() public view returns (uint[] memory) {
        uint winningVoteCount = 0;
        uint proposalCount = proposals.length;

        for (uint p = 0; p < proposalCount; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
            }
        }

        uint tieCount = 0;
        for (uint p = 0; p < proposalCount; p++) {
            if (proposals[p].voteCount == winningVoteCount) {
                tieCount++;
            }
        }

        uint[] memory tiedProposals = new uint[](tieCount);
        uint index = 0;
        for (uint p = 0; p < proposalCount; p++) {
            if (proposals[p].voteCount == winningVoteCount) {
                tiedProposals[index] = p;
                index++;
            }
        }

        return tiedProposals;
    }

    function winnerNames() external view returns (bytes32[] memory) {
        uint[] memory winningProposalsList = winningProposals();
        bytes32[] memory winnerNames_ = new bytes32[](winningProposalsList.length);

        for (uint i = 0; i < winningProposalsList.length; i++) {
            winnerNames_[i] = proposals[winningProposalsList[i]].name;
        }

        return winnerNames_;
    }
}
