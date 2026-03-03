// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PaymentProcessor
 * @dev Smart contract for processing crypto payments with escrow functionality
 */
contract PaymentProcessor is ReentrancyGuard, Pausable, Ownable {

    // Payment status enum
    enum PaymentStatus {
        Pending,
        Completed,
        Refunded,
        Disputed
    }

    // Payment struct
    struct Payment {
        bytes32 paymentId;
        address payer;
        address payable merchant;
        uint256 amount;
        address token;
        PaymentStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        string metadata;
    }

    // State variables
    mapping(bytes32 => Payment) public payments;
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public merchantBalances;

    uint256 public platformFeeBasisPoints = 50; // 0.5%
    uint256 public constant MAX_FEE = 500; // 5% max
    uint256 public paymentExpiryDuration = 1 hours;

    address public feeRecipient;

    // Events
    event PaymentCreated(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed merchant,
        uint256 amount,
        address token
    );

    event PaymentCompleted(
        bytes32 indexed paymentId,
        address indexed merchant,
        uint256 amount
    );

    event PaymentRefunded(
        bytes32 indexed paymentId,
        address indexed payer,
        uint256 amount
    );

    event MerchantWithdrawal(
        address indexed merchant,
        uint256 amount
    );

    event TokenSupportUpdated(
        address indexed token,
        bool supported
    );

    // Modifiers
    modifier validPayment(bytes32 _paymentId) {
        require(payments[_paymentId].payer != address(0), "Payment does not exist");
        _;
    }

    modifier onlyPayer(bytes32 _paymentId) {
        require(payments[_paymentId].payer == msg.sender, "Only payer can call");
        _;
    }

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Create a new payment with native token (ETH)
     */
    function createPaymentETH(
        bytes32 _paymentId,
        address payable _merchant,
        string calldata _metadata
    ) external payable whenNotPaused nonReentrant {
        require(msg.value > 0, "Amount must be greater than 0");
        require(_merchant != address(0), "Invalid merchant address");
        require(payments[_paymentId].payer == address(0), "Payment ID already exists");

        Payment memory payment = Payment({
            paymentId: _paymentId,
            payer: msg.sender,
            merchant: _merchant,
            amount: msg.value,
            token: address(0),
            status: PaymentStatus.Pending,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + paymentExpiryDuration,
            metadata: _metadata
        });

        payments[_paymentId] = payment;

        emit PaymentCreated(
            _paymentId,
            msg.sender,
            _merchant,
            msg.value,
            address(0)
        );
    }

    /**
     * @dev Create a new payment with ERC20 token
     */
    function createPaymentToken(
        bytes32 _paymentId,
        address payable _merchant,
        address _token,
        uint256 _amount,
        string calldata _metadata
    ) external whenNotPaused nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(_merchant != address(0), "Invalid merchant address");
        require(supportedTokens[_token], "Token not supported");
        require(payments[_paymentId].payer == address(0), "Payment ID already exists");

        // Transfer tokens from payer to contract
        IERC20 token = IERC20(_token);
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Token transfer failed"
        );

        Payment memory payment = Payment({
            paymentId: _paymentId,
            payer: msg.sender,
            merchant: _merchant,
            amount: _amount,
            token: _token,
            status: PaymentStatus.Pending,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + paymentExpiryDuration,
            metadata: _metadata
        });

        payments[_paymentId] = payment;

        emit PaymentCreated(
            _paymentId,
            msg.sender,
            _merchant,
            _amount,
            _token
        );
    }

    /**
     * @dev Complete payment and release funds to merchant
     */
    function completePayment(bytes32 _paymentId) 
        external 
        validPayment(_paymentId) 
        whenNotPaused 
        nonReentrant 
    {
        Payment storage payment = payments[_paymentId];

        require(payment.status == PaymentStatus.Pending, "Payment not pending");
        require(block.timestamp <= payment.expiresAt, "Payment expired");

        payment.status = PaymentStatus.Completed;

        // Calculate fees
        uint256 fee = (payment.amount * platformFeeBasisPoints) / 10000;
        uint256 merchantAmount = payment.amount - fee;

        if (payment.token == address(0)) {
            // Native token (ETH)
            (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");

            (bool merchantSuccess, ) = payment.merchant.call{value: merchantAmount}("");
            require(merchantSuccess, "Merchant transfer failed");
        } else {
            // ERC20 token
            IERC20 token = IERC20(payment.token);
            require(token.transfer(feeRecipient, fee), "Fee transfer failed");
            require(token.transfer(payment.merchant, merchantAmount), "Merchant transfer failed");
        }

        emit PaymentCompleted(_paymentId, payment.merchant, merchantAmount);
    }

    /**
     * @dev Refund payment to payer
     */
    function refundPayment(bytes32 _paymentId)
        external
        validPayment(_paymentId)
        onlyPayer(_paymentId)
        whenNotPaused
        nonReentrant
    {
        Payment storage payment = payments[_paymentId];

        require(payment.status == PaymentStatus.Pending, "Payment not pending");

        payment.status = PaymentStatus.Refunded;

        if (payment.token == address(0)) {
            // Native token (ETH)
            (bool success, ) = payment.payer.call{value: payment.amount}("");
            require(success, "Refund transfer failed");
        } else {
            // ERC20 token
            IERC20 token = IERC20(payment.token);
            require(token.transfer(payment.payer, payment.amount), "Refund transfer failed");
        }

        emit PaymentRefunded(_paymentId, payment.payer, payment.amount);
    }

    /**
     * @dev Add or remove supported token
     */
    function setTokenSupport(address _token, bool _supported) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        supportedTokens[_token] = _supported;
        emit TokenSupportUpdated(_token, _supported);
    }

    /**
     * @dev Update platform fee
     */
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE, "Fee exceeds maximum");
        platformFeeBasisPoints = _newFee;
    }

    /**
     * @dev Update fee recipient
     */
    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid address");
        feeRecipient = _newRecipient;
    }

    /**
     * @dev Update payment expiry duration
     */
    function setPaymentExpiryDuration(uint256 _newDuration) external onlyOwner {
        require(_newDuration >= 5 minutes && _newDuration <= 7 days, "Invalid duration");
        paymentExpiryDuration = _newDuration;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get payment details
     */
    function getPayment(bytes32 _paymentId) external view returns (Payment memory) {
        return payments[_paymentId];
    }

    /**
     * @dev Check if payment exists
     */
    function paymentExists(bytes32 _paymentId) external view returns (bool) {
        return payments[_paymentId].payer != address(0);
    }

    // Receive function
    receive() external payable {
        revert("Use createPaymentETH");
    }
}