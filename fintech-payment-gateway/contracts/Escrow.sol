// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PaymentEscrow
 * @dev Escrow contract for holding funds during dispute resolution
 */
contract PaymentEscrow is ReentrancyGuard, Ownable {

    enum EscrowStatus {
        Active,
        Released,
        Refunded,
        Disputed,
        Resolved
    }

    struct Escrow {
        bytes32 escrowId;
        address payer;
        address payable merchant;
        uint256 amount;
        address token;
        EscrowStatus status;
        uint256 createdAt;
        uint256 releaseTime;
        address arbitrator;
        string disputeReason;
    }

    mapping(bytes32 => Escrow) public escrows;
    mapping(address => bool) public arbitrators;

    uint256 public escrowDuration = 3 days;
    uint256 public disputeWindow = 7 days;

    event EscrowCreated(
        bytes32 indexed escrowId,
        address indexed payer,
        address indexed merchant,
        uint256 amount
    );

    event EscrowReleased(bytes32 indexed escrowId, address indexed merchant);
    event EscrowRefunded(bytes32 indexed escrowId, address indexed payer);
    event DisputeOpened(bytes32 indexed escrowId, string reason);
    event DisputeResolved(bytes32 indexed escrowId, bool releasedToMerchant);

    modifier onlyArbitrator() {
        require(arbitrators[msg.sender], "Not an arbitrator");
        _;
    }

    modifier validEscrow(bytes32 _escrowId) {
        require(escrows[_escrowId].payer != address(0), "Escrow does not exist");
        _;
    }

    function createEscrow(
        bytes32 _escrowId,
        address payable _merchant,
        uint256 _releaseTime
    ) external payable nonReentrant {
        require(msg.value > 0, "Amount required");
        require(_merchant != address(0), "Invalid merchant");
        require(escrows[_escrowId].payer == address(0), "Escrow exists");

        escrows[_escrowId] = Escrow({
            escrowId: _escrowId,
            payer: msg.sender,
            merchant: _merchant,
            amount: msg.value,
            token: address(0),
            status: EscrowStatus.Active,
            createdAt: block.timestamp,
            releaseTime: _releaseTime,
            arbitrator: address(0),
            disputeReason: ""
        });

        emit EscrowCreated(_escrowId, msg.sender, _merchant, msg.value);
    }

    function releaseEscrow(bytes32 _escrowId) 
        external 
        validEscrow(_escrowId) 
        nonReentrant 
    {
        Escrow storage escrow = escrows[_escrowId];

        require(
            msg.sender == escrow.payer || msg.sender == owner(),
            "Not authorized"
        );
        require(escrow.status == EscrowStatus.Active, "Not active");
        require(block.timestamp >= escrow.releaseTime, "Release time not reached");

        escrow.status = EscrowStatus.Released;

        (bool success, ) = escrow.merchant.call{value: escrow.amount}("");
        require(success, "Transfer failed");

        emit EscrowReleased(_escrowId, escrow.merchant);
    }

    function openDispute(bytes32 _escrowId, string calldata _reason)
        external
        validEscrow(_escrowId)
    {
        Escrow storage escrow = escrows[_escrowId];

        require(msg.sender == escrow.payer, "Only payer can dispute");
        require(escrow.status == EscrowStatus.Active, "Not active");
        require(block.timestamp < escrow.releaseTime + disputeWindow, "Dispute window closed");

        escrow.status = EscrowStatus.Disputed;
        escrow.disputeReason = _reason;

        emit DisputeOpened(_escrowId, _reason);
    }

    function resolveDispute(bytes32 _escrowId, bool _releaseToMerchant)
        external
        onlyArbitrator
        validEscrow(_escrowId)
        nonReentrant
    {
        Escrow storage escrow = escrows[_escrowId];

        require(escrow.status == EscrowStatus.Disputed, "Not disputed");

        escrow.status = EscrowStatus.Resolved;

        if (_releaseToMerchant) {
            (bool success, ) = escrow.merchant.call{value: escrow.amount}("");
            require(success, "Transfer failed");
            emit EscrowReleased(_escrowId, escrow.merchant);
        } else {
            (bool success, ) = payable(escrow.payer).call{value: escrow.amount}("");
            require(success, "Refund failed");
            emit EscrowRefunded(_escrowId, escrow.payer);
        }

        emit DisputeResolved(_escrowId, _releaseToMerchant);
    }

    function addArbitrator(address _arbitrator) external onlyOwner {
        require(_arbitrator != address(0), "Invalid address");
        arbitrators[_arbitrator] = true;
    }

    function removeArbitrator(address _arbitrator) external onlyOwner {
        arbitrators[_arbitrator] = false;
    }

    receive() external payable {
        revert("Use createEscrow");
    }
}