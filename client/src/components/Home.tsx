import type { Contract } from "ethers";
import { ethers } from "ethers";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export default function Home({
  marketplace,
  nft,
  connectWallet,
}: {
  marketplace: Contract;
  nft: Contract;
  connectWallet: () => void;
}) {
  const [items, setItems] = useState<
    {
      id: number;
      name: string;
      description: string;
      image: string;
      price: string;
    }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadMarketplaceItems = async (marketPlace: Contract, nft: Contract) => {
    const fetchTokenMetadata = async (tokenId: number) => {
      const item = (await marketPlace.items(tokenId)).toObject();
      if (!item || item.isSold) {
        return null; // Skip if item is sold or not found
      }
      const nftContract = nft.attach(item.nftAddress) as Contract;
      const tokenUri = await nftContract.tokenURI(item.tokenID);
      const response = await fetch(tokenUri);
      const metadata = await response.json();
      return {
        id: item.itemId,
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        price: ethers.formatEther(item.price),
      };
    };
    try {
      const itemCount = await marketPlace.itemCount();
      const itemsArray = await Promise.all(
        Array.from(
          { length: parseInt(itemCount.toString()) },
          (_, i) => i + 1
        ).map((i) => fetchTokenMetadata(i))
      );

      // Filter out items that are already sold
      const availableItems = itemsArray.filter((item) => item !== null);

      setItems(availableItems);
    } catch (error) {
      setError("Failed to load marketplace items. Please try again later.");
      console.error("Error loading marketplace items:", error);
    }
  };
  const purchaseItem = async (itemId: number) => {
    if (!marketplace || !nft) return;
    try {
      const price = await marketplace.getPrice(itemId);
      const tx = await marketplace.purchaseItem(itemId, { value: price });
      await tx.wait();
      console.log("Item purchased successfully:", itemId);
      setLoading(true);
      await loadMarketplaceItems(marketplace, nft);
      setLoading(false);
    } catch (error) {
      console.error("Error purchasing item:", error);
    }
  };
  useEffect(() => {
    const fetchItems = async () => {
      if (marketplace && nft) {
        setError(null);
        setLoading(true);
        await loadMarketplaceItems(marketplace, nft);
        setLoading(false);
      } else {
        setError(
          "Please connect to your Metamask to view and purchase marketplace items."
        );
      }
    };
    fetchItems();
  }, [marketplace, nft]);
  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-950 p-4">
      <p className=" text-xs dark:text-gray-400">
        BUY, SELL AND DISCOVER RARE DIGITAL ITEMS
      </p>
      <h1 className="mt-3 text-2xl font-bold dark:text-white">
        Welcome to the NFT Marketplace
      </h1>
      {error && (
        <div className="flex flex-col gap-2 justify-center items-center h-[calc(100vh-200px)] ">
          <p className="text-red-500 mt-2">{error}</p>
          {(!marketplace || !nft) && (
            <Button onClick={connectWallet} className="ml-4">
              Connect Wallet
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-950">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          <p className="ml-2 text-gray-500 dark:text-gray-400">
            Loading Marketplace Items...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <p className="text-gray-500 dark:text-gray-400">
            No items available in the marketplace.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Explore the available items below:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="border rounded-lg overflow-hidden shadow-md w-1/2 mx-auto"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-72 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-lg font-bold">{item.name}</h2>
                  <p className="text-gray-600">{item.description}</p>
                  <Button
                    onClick={() => purchaseItem(item.id)}
                    className="mt-2 font-bold"
                  >
                    Buy for {item.price} ETH
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
