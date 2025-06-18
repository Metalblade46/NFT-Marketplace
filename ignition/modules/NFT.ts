import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


export default buildModule("NFT", (m) => {
  const nft = m.contract("NFT", []);
  return { nft };
});