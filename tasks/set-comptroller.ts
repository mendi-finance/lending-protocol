import { task } from "hardhat/config";

// npx hardhat set-comptroller --network $NETWORK

task("set-comptroller", "Sets comptroller implementation in Unitroller")
    .setAction(
        async (args, hre, runSuper) => {
            console.log("running task: set-comptroller");

            const {
                ethers,
                deployments: { get },
            } = hre;

            const ComptrollerProxy = await ethers.getContract("Unitroller");
            const ComptrollerImplementation = await ethers.getContract("Comptroller");

            const setTx = await ComptrollerProxy._setPendingImplementation((await get("Comptroller")).address);
            await setTx.wait();

            const acceptTx = await ComptrollerImplementation._become((await get("Unitroller")).address);
            await acceptTx.wait();
        }
    );
