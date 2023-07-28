import { Deployment } from "hardhat-deploy/types";

export const filterCTokenDeployments = (deployments: {
    [name: string]: Deployment;
}) => {
    const cTokenDeployments = Object.entries(deployments)
        .filter(
            ([key, value]) =>
                key.startsWith("CErc20Immutable_") ||
                (key.startsWith("CErc20Upgradable_") &&
                    !key.endsWith("_Proxy") &&
                    !key.endsWith("_Implementation"))
        )
        .map(([key, value]) => value);

    return cTokenDeployments;
};
