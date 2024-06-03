#!/bin/(shell)

# NETWORK=linea_sepolia \
# OWNER=0x6a39C1B89a25a8fA399fF73766417ED2213d5dEe \
# sh ./tasks/initial/index.sh

npx hardhat deploy --network $NETWORK

npx hardhat deploy-comptroller --network $NETWORK

npx hardhat set-comptroller --network $NETWORK

npx hardhat deploy-ctoken \
--network $NETWORK \
--underlying-address 0x06565ed324Ee9fb4DB0FF80B7eDbE4Cb007555a3 \
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
--underlying-address 0xf17a935A89cB4CBc176cd5afeBCB9805e5Ed7c1A \
--underlying-decimals 6 \
--underlying-name "USDC" \
--underlying-symbol "USDC" \
--decimals 8 \
--comptroller-key "Unitroller" \
--interest-rate-model-key "StableRateModel" \
--owner $OWNER \
--proxy true

npx hardhat deploy-simple-price-oracle --network $NETWORK

npx hardhat update-price-oracle --network $NETWORK --price-oracle-key "SimplePriceOracle"

npx hardhat support-markets --network $NETWORK

npx hardhat etherscan-verify --network $NETWORK