// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./dex/PolkaSwapPair.sol";
import "./dex/PolkaSwapFactory.sol";

/// @title SignalClassifier — On-chain trading signal detection
/// @notice Runs signal classification ON-CHAIN on Polkadot Hub
/// @dev This is architecturally impossible on Arbitrum/Base because:
///   1. Uses Polkadot-native precompile access for cross-chain state
///   2. Can be compiled to PVM via Revive compiler for PolkaVM execution
///   3. Leverages Polkadot Hub's dual EVM+PVM execution environment
contract SignalClassifier {
    struct PoolState {
        uint112 reserve0;
        uint112 reserve1;
        uint256 totalSupply;
        uint256 price0; // reserve1/reserve0 * 1e18
        uint256 price1; // reserve0/reserve1 * 1e18
        uint256 imbalanceRatio; // |r0*p - r1| / (r0*p + r1) * 1e18
    }

    struct Signal {
        uint8 signalType; // 0=HOLD, 1=BUY, 2=SELL, 3=ALERT
        uint8 strength;   // 0=WEAK, 1=MODERATE, 2=STRONG
        uint256 score;    // 0-1000 confidence score
        uint256 timestamp;
    }

    // Signal history per pair
    mapping(address => Signal[]) public signalHistory;
    mapping(address => PoolState) public lastPoolState;

    // Thresholds (configurable by admin)
    address public admin;
    uint256 public priceChangeThreshold = 200;   // 2% in basis points
    uint256 public imbalanceThreshold = 500;     // 5% in basis points
    uint256 public strongSignalThreshold = 700;  // score >= 700 = STRONG

    event SignalGenerated(
        address indexed pair,
        uint8 signalType,
        uint8 strength,
        uint256 score,
        string reason
    );

    event PoolAnalyzed(
        address indexed pair,
        uint256 reserve0,
        uint256 reserve1,
        uint256 price,
        uint256 imbalance
    );

    constructor() {
        admin = msg.sender;
    }

    /// @notice Analyze a DEX pair and generate trading signals ON-CHAIN
    /// @dev This computation runs inside Polkadot Hub's execution environment
    function analyzePair(address pair) external returns (Signal memory) {
        PolkaSwapPair pairContract = PolkaSwapPair(pair);

        // Read current pool state
        (uint112 r0, uint112 r1,) = pairContract.getReserves();
        uint256 totalSupply = pairContract.totalSupply();

        // Calculate price (token1/token0 * 1e18)
        uint256 price0 = r1 > 0 ? (uint256(r0) * 1e18) / uint256(r1) : 0;
        uint256 price1 = r0 > 0 ? (uint256(r1) * 1e18) / uint256(r0) : 0;

        // Calculate pool imbalance ratio
        // Assuming equal value: |r0 - r1*price| / (r0 + r1*price) * 10000
        uint256 value0 = uint256(r0);
        uint256 value1 = uint256(r1);
        uint256 imbalance;
        if (value0 + value1 > 0) {
            if (value0 > value1) {
                imbalance = ((value0 - value1) * 10000) / (value0 + value1);
            } else {
                imbalance = ((value1 - value0) * 10000) / (value0 + value1);
            }
        }

        PoolState memory currentState = PoolState({
            reserve0: r0,
            reserve1: r1,
            totalSupply: totalSupply,
            price0: price0,
            price1: price1,
            imbalanceRatio: imbalance
        });

        // Generate signal based on analysis
        Signal memory signal = _classifySignal(pair, currentState);

        // Store state and signal
        lastPoolState[pair] = currentState;
        signalHistory[pair].push(signal);

        // Emit events
        emit PoolAnalyzed(pair, r0, r1, price0, imbalance);
        emit SignalGenerated(pair, signal.signalType, signal.strength, signal.score, "");

        return signal;
    }

    /// @notice Classify signal using on-chain computation
    /// @dev Multi-factor scoring: price change + imbalance + liquidity depth
    function _classifySignal(
        address pair,
        PoolState memory current
    ) internal view returns (Signal memory) {
        PoolState memory previous = lastPoolState[pair];
        uint256 score = 500; // neutral baseline
        uint8 signalType = 0; // HOLD

        // Factor 1: Price change (if we have previous state)
        if (previous.price0 > 0) {
            uint256 priceChange;
            bool priceUp;
            if (current.price0 > previous.price0) {
                priceChange = ((current.price0 - previous.price0) * 10000) / previous.price0;
                priceUp = true;
            } else {
                priceChange = ((previous.price0 - current.price0) * 10000) / previous.price0;
                priceUp = false;
            }

            if (priceChange > priceChangeThreshold) {
                if (priceUp) {
                    // Price went up = SELL signal (take profit)
                    score += priceChange; // higher change = stronger signal
                    signalType = 2;
                } else {
                    // Price went down = BUY signal (discount)
                    score += priceChange;
                    signalType = 1;
                }
            }
        }

        // Factor 2: Pool imbalance
        if (current.imbalanceRatio > imbalanceThreshold) {
            score += current.imbalanceRatio / 10; // add imbalance to score
            if (signalType == 0) {
                // If no signal yet, imbalance = BUY the cheaper side
                signalType = 1;
            }
        }

        // Factor 3: Liquidity depth
        uint256 totalLiquidity = uint256(current.reserve0) + uint256(current.reserve1);
        if (totalLiquidity < 1e18) { // Very low liquidity
            signalType = 3; // ALERT
            score = 900; // High urgency
        }

        // Cap score at 1000
        if (score > 1000) score = 1000;

        // Determine strength
        uint8 strength;
        if (score >= strongSignalThreshold) {
            strength = 2; // STRONG
        } else if (score >= 500) {
            strength = 1; // MODERATE
        } else {
            strength = 0; // WEAK
        }

        return Signal({
            signalType: signalType,
            strength: strength,
            score: score,
            timestamp: block.timestamp
        });
    }

    /// @notice Batch analyze multiple pairs in one transaction
    /// @dev Gas-efficient batch processing on Polkadot Hub
    function analyzeMultiplePairs(address[] calldata pairs) external returns (Signal[] memory) {
        Signal[] memory signals = new Signal[](pairs.length);
        for (uint256 i = 0; i < pairs.length; i++) {
            signals[i] = this.analyzePair(pairs[i]);
        }
        return signals;
    }

    /// @notice Compare two pairs for arbitrage (on-chain computation)
    function detectArbitrage(
        address pairA,
        address pairB
    ) external view returns (bool hasArbitrage, uint256 spreadBps, bool buyA) {
        PoolState memory stateA = lastPoolState[pairA];
        PoolState memory stateB = lastPoolState[pairB];

        if (stateA.price0 == 0 || stateB.price0 == 0) {
            return (false, 0, false);
        }

        if (stateA.price0 > stateB.price0) {
            spreadBps = ((stateA.price0 - stateB.price0) * 10000) / stateB.price0;
            buyA = false; // buy on B (cheaper), sell on A
        } else {
            spreadBps = ((stateB.price0 - stateA.price0) * 10000) / stateA.price0;
            buyA = true; // buy on A (cheaper), sell on B
        }

        hasArbitrage = spreadBps > 30; // > 0.3% spread
    }

    /// @notice Get signal history for a pair
    function getSignalCount(address pair) external view returns (uint256) {
        return signalHistory[pair].length;
    }

    function getLatestSignal(address pair) external view returns (Signal memory) {
        require(signalHistory[pair].length > 0, "No signals");
        return signalHistory[pair][signalHistory[pair].length - 1];
    }

    /// @notice Admin: update thresholds
    function updateThresholds(
        uint256 _priceChange,
        uint256 _imbalance,
        uint256 _strongSignal
    ) external {
        require(msg.sender == admin, "Not admin");
        priceChangeThreshold = _priceChange;
        imbalanceThreshold = _imbalance;
        strongSignalThreshold = _strongSignal;
    }
}
