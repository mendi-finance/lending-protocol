#!/bin/(shell)

# NETWORK=linea \
# OWNER=0x57cd331c7b2c7582625810465ea3cf9bdca21236 \
# sh ./tasks/initial/index.sh

npx hardhat deploy --network $NETWORK

npx hardhat deploy-ctoken \
--network $NETWORK \
--underlying-address 0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f \
--underlying-decimals 18 \
--underlying-name "Wrapped Ether" \
--underlying-symbol "WETH" \
--decimals 8 \
--comptroller-key "Unitroller" \
--interest-rate-model-key "MediumRateModel" \
--owner $OWNER \
--proxy true

npx hardhat deploy-ctoken \
--network $NETWORK \
--underlying-address 0x176211869ca2b568f2a7d4ee941e073a821ee1ff \
--underlying-decimals 6 \
--underlying-name "USD Coin" \
--underlying-symbol "USDC" \
--decimals 8 \
--comptroller-key "Unitroller" \
--interest-rate-model-key "StableRateModel" \
--owner $OWNER \
--proxy true

npx hardhat deploy-ctoken \
--network $NETWORK \
--underlying-address 0xa219439258ca9da29e9cc4ce5596924745e12b93 \
--underlying-decimals 6 \
--underlying-name "USD Tether" \
--underlying-symbol "USDT" \
--decimals 8 \
--comptroller-key "Unitroller" \
--interest-rate-model-key "StableRateModel" \
--owner $OWNER \
--proxy true


npx hardhat deploy-price-oracle --network $NETWORK

npx hardhat update-price-oracle --network $NETWORK --price-oracle-key "WitnetPriceOracle"

npx hardhat add-missing-markets --network $NETWORK