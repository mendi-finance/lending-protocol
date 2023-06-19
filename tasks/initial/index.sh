#!/bin/(shell)

# NETWORK=linea_goerli \
# OWNER=0x67e633b2494f126c7e828B63b32E4d2667091bE4 \
# sh ./tasks/initial/index.sh

npx hardhat deploy --network $NETWORK

npx hardhat deploy-ctoken \
--network $NETWORK \
--underlying-address 0x2C1b868d6596a18e32E61B901E4060C872647b6C \
--underlying-decimals 18 \
--underlying-name "Wrapped Ether" \
--underlying-symbol "WETH" \
--decimals 8 \
--comptroller-key "Unitroller" \
--interest-rate-model-key "MediumRateModel" \
--owner $OWNER

npx hardhat deploy-ctoken \
--network $NETWORK \
--underlying-address 0xf56dc6695cF1f5c364eDEbC7Dc7077ac9B586068 \
--underlying-decimals 6 \
--underlying-name "USD Coin" \
--underlying-symbol "USDC" \
--decimals 8 \
--comptroller-key "Unitroller" \
--interest-rate-model-key "StableRateModel" \
--owner $OWNER

npx hardhat deploy-ctoken \
--network $NETWORK \
--underlying-address 0x1990BC6dfe2ef605Bfc08f5A23564dB75642Ad73 \
--underlying-decimals 6 \
--underlying-name "USD Tether" \
--underlying-symbol "USDT" \
--decimals 8 \
--comptroller-key "Unitroller" \
--interest-rate-model-key "StableRateModel" \
--owner $OWNER


npx hardhat deploy-price-oracle --network $NETWORK

npx hardhat update-price-oracle --network $NETWORK --price-oracle-key "WitnetPriceOracle"

npx hardhat add-missing-markets --network $NETWORK