import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


export default buildModule("Marketplace", (m) => {
  const marketPlace = m.contract("Marketplace", [1]);
  return { marketPlace };
});