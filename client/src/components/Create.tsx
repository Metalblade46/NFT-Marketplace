import { ethers, type Contract } from "ethers";
import { PinataSDK } from "pinata";
import { useState } from "react";
import marketplaceAddress from "../contracts-data/Marketplace-address.json";
import nftAddress from "../contracts-data/NFT-address.json";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { useNavigate } from "react-router";

export default function Create({
  nft,
  marketplace,
}: {
  nft: Contract | null;
  marketplace: Contract | null;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  const uploadtoPinata = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const pinata = new PinataSDK({
      pinataGateway: import.meta.env.VITE_GATEWAY_URL,
      pinataJwt: import.meta.env.VITE_PINATA_JWT,
    });
    try {
      const file = event.target.files?.[0];
      if (file) {
        setLoading(true);
        const response = await pinata.upload.public.file(file);
        console.log("File uploaded to Pinata:", response);
        const { cid } = response;
        const url = await pinata.gateways.public.convert(cid);
        setImage(url);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error uploading file to Pinata:", error);
      setLoading(false);
    }
  };
  const createNFT = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (!image || !price || !name || !description) {
      console.error("All fields are required");
      return;
    }
    try {
      const pinata = new PinataSDK({
        pinataGateway: import.meta.env.VITE_GATEWAY_URL,
        pinataJwt: import.meta.env.VITE_PINATA_JWT,
      });
      const metadata = {
        name,
        description,
        image,
      };
      const response = await pinata.upload.public.json(metadata);
      const { cid } = response;
      const url = await pinata.gateways.public.convert(cid);
      console.log("NFT Metadata URL:", url);
      // Here you would typically call your smart contract to mint the NFT
      await mintAndList(url);
      navigate("/");
    } catch (error) {
      console.error("Error creating NFT:", error);
    }
  };
  const mintAndList = async (metadataUrl: string) => {
    if (!nft || !marketplace) {
      console.error("NFT or Marketplace contract is not available");
      return;
    }
    try {
      //mint the NFT
      const mintTx = await nft.createNFT(metadataUrl);
      const mintReceipt = await mintTx.wait();
      console.log("NFT Minted:", mintReceipt);
      // Get the token ID from the mint receipt
      const tokenId = await nft.nextTokenId();
      console.log("Token ID:", tokenId.toString());
      if (!tokenId) {
        console.error("Token ID not found");
        return;
      }
      //list the NFT
      const approvalTx = await nft.setApprovalForAll(
        marketplaceAddress.address,
        true
      );
      await approvalTx.wait();
      const priceInWei = ethers.parseEther(price!.toString());
      const listTx = await marketplace.addItem(
        nftAddress.address,
        tokenId,
        priceInWei
      );
      await listTx.wait();
    } catch (error) {
      console.error("Error minting and listing NFT:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-950 flex justify-center items-center p-4">
      {!nft || !marketplace ? (
        <div className="flex justify-center items-center h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-950">
          <p className="text-gray-500 dark:text-gray-400">
            Please connect to your Metamask to create an NFT.
          </p>
        </div>
      ) : (
        <div className="h-full">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">
            Create NFT
          </h2>
          <form
            onSubmit={createNFT}
            className="text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
          >
            <div className="mb-4 flex flex-col items-start">
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Name
              </label>
              <Input
                type="text"
                value={name || ""}
                onChange={(e) => setName(e.target.value)}
                className="border border-gray-300 rounded-md  w-full"
                required
                placeholder="Enter NFT Name"
              />
            </div>
            <div className="mb-4 flex flex-col items-start">
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Description
              </label>
              <Textarea
                value={description || ""}
                onChange={(e) => setDescription(e.target.value)}
                className="border border-gray-300 rounded-md  w-full"
                required
                placeholder="Enter NFT Description"
              />
            </div>
            <div className="mb-4 flex flex-col items-start">
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Price (in ETH)
              </label>
              <Input
                type="number"
                value={price || ""}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="border border-gray-300 rounded-md p-2 w-full"
                required
                placeholder="Enter NFT Price"
              />
            </div>
            {image && (
              <div className="mb-4 flex flex-col items-start">
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  Image Preview
                </label>
                <img
                  src={image}
                  alt="NFT Preview"
                  className="border border-gray-300 rounded-md p-2 w-80 h-80 object-cover mx-auto"
                />
              </div>
            )}
            <div className="mb-4 flex flex-col items-start">
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Image
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={uploadtoPinata}
                className="border border-gray-300 rounded-md w-full"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white rounded-md px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create NFT
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
