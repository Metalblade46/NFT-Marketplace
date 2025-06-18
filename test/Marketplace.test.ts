import { expect } from "chai";
import hre from "hardhat";
import {
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

const toWei = (etherAmount: number) => hre.ethers.parseEther(etherAmount.toString());
async function deployNFTAndMarketplaceFixture() {
    const nft = await hre.ethers.deployContract("NFT", []);
    const marketPlace = await hre.ethers.deployContract("Marketplace", [1])
    const [deployer, address1, address2] = await hre.ethers.getSigners();
    const nftAddress = await nft.getAddress();
    const marketPlaceAddress = await marketPlace.getAddress();
    return { nft, marketPlace, deployer, address1, address2, nftAddress, marketPlaceAddress };
}
describe("Deployment", () => {
    it("Should display the name and symbol of nft correctly", async () => {
        const { nft } = await loadFixture(deployNFTAndMarketplaceFixture);
        expect(await nft.name()).to.equal("MyNFT");
        expect(await nft.symbol()).to.equal("MNFT");
    })
    it("Should display the feeAccount and fee percentage correctly", async () => {
        const { marketPlace, deployer } = await loadFixture(deployNFTAndMarketplaceFixture);

        expect(await marketPlace.feeAccount()).to.equal(deployer.address);
        expect(await marketPlace.feePercent()).to.equal(1);
    })
})
describe("Minting NFTs", () => {
    it("Should be minting NFTs", async () => {
        const { nft, address1 } = await loadFixture(deployNFTAndMarketplaceFixture);
        await nft.connect(address1).createNFT("Test Token");
        expect(await nft.nextTokenId()).to.equal(1);
        expect(await nft.balanceOf(address1.address)).to.equal(1);
        expect(await nft.tokenURI(1)).to.equal("Test Token");
    })
})

describe("Adding Marketplace items", () => {
    it("Should add marketplace items", async () => {
        const { nft, marketPlace, address1, nftAddress, marketPlaceAddress } = await loadFixture(deployNFTAndMarketplaceFixture);
        await nft.connect(address1).createNFT("Test Token");
        await nft.connect(address1).setApprovalForAll(marketPlaceAddress, true);
        expect(await marketPlace.connect(address1).addItem(nftAddress, 1, toWei(1))).to.emit(marketPlace, "ItemAdded").withArgs(1, address1.address, nftAddress, 1, toWei(1));
        expect(await marketPlace.itemCount()).to.equal(1);
        expect(await nft.ownerOf(1)).to.equal(marketPlaceAddress);
        const item = await marketPlace.items(1);
        expect(item.itemId).to.equal(1);
        expect(item.nftAddress).to.equal(nftAddress);
        expect(item.tokenID).to.equal(1);
        expect(item.price).to.equal(toWei(1));
        expect(item.isSold).to.equal(false);
    })
})
describe("Purchase MarketPlace items", () => {
    async function makeItem(){
const { nft, nftAddress, marketPlace, marketPlaceAddress,deployer, address1, address2 } = await loadFixture(deployNFTAndMarketplaceFixture);
        await nft.connect(address1).createNFT("Test Token");
        await nft.connect(address1).setApprovalForAll(marketPlaceAddress, true);
        await marketPlace.connect(address1).addItem(nftAddress, 1, toWei(1));
        return {nft, nftAddress, marketPlace, marketPlaceAddress,deployer, address1, address2};
    }
    it("Should purchase items", async () => {
        const {nft, nftAddress, marketPlace,deployer, address1, address2 } = await loadFixture(makeItem);
        const sellerInitialBalance = await hre.ethers.provider.getBalance(address1.address);
        const feeAccountInitialBalance = await hre.ethers.provider.getBalance(deployer.address);
        const price = await marketPlace.getPrice(1);
        //make purchase
        expect(await marketPlace.connect(address2).purchaseItem(1, {
            value: price
        })).to.emit(marketPlace, "ItemSold").withArgs(1, address1.address, address2.address, nftAddress, 1, toWei(1));
        const sellerFinalBalance = await hre.ethers.provider.getBalance(address1.address); 
        const feeAccountFinalBalance = await hre.ethers.provider.getBalance(deployer.address); 
        expect(await nft.ownerOf(1)).to.equal(address2.address);
        expect((await marketPlace.items(1)).isSold).to.equal(true);
        expect(sellerFinalBalance-sellerInitialBalance).to.equal(toWei(1)*BigInt(99)/BigInt(100));
        expect(feeAccountFinalBalance-feeAccountInitialBalance).to.equal(toWei(1)*BigInt(1)/BigInt(100));
    })
    it("Should fail if invalid id or insufficient ethers are sent", async()=>{
        const {marketPlace, address2 } = await loadFixture(makeItem);
         const price = await marketPlace.getPrice(1);
        //make purchase
       await expect(marketPlace.connect(address2).purchaseItem(1, {
            value: price-BigInt(10)
        })).to.be.revertedWith("Invalid Price");
       await expect(marketPlace.connect(address2).purchaseItem(2, {
            value: price
        })).to.be.revertedWith("Item id invalid");
    })
    it("Should fail if sold item is again tried to be bought", async()=>{
        const {nft, nftAddress, marketPlace,deployer, address1, address2 } = await loadFixture(makeItem);
        const price = await marketPlace.getPrice(1);
        await marketPlace.connect(address2).purchaseItem(1,{
            value:price
        })
        await expect(marketPlace.connect(address1).purchaseItem(1,{
            value:price
        })).to.be.revertedWith("Item already sold");
    })

})