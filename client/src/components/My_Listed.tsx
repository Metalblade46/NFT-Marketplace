import { ethers, type Contract } from "ethers";
import { useEffect, useState } from "react";


export default function My_Listed({
  marketplace,
  nft,
  address
}: {
  marketplace: Contract | null;
  nft: Contract | null;
  address: string | null;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    const fetchTokenMetadata = async (tokenId: number) => {
      const item = (await marketplace!.items(tokenId)).toObject();
      if (!item || item.seller.toLowerCase() !== address?.toLowerCase()) {
        return null; // Skip if item is sold or not found
      }
      const nftContract = nft!.attach(item.nftAddress) as Contract;
      const tokenUri = await nftContract.tokenURI(item.tokenID);
      const response = await fetch(tokenUri);
      const metadata = await response.json();
      return {
        id: item.itemId,
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        price: ethers.formatEther(item.price),
        isSold: item.isSold,
      }
    }
    const fetchListedItems = async () => {
      if (!marketplace || !nft || !address) return;
      setLoading(true);
      try {
        const itemCount = await marketplace.itemCount();
        const fee = await marketplace.feePercent();
        console.log("Marketplace fee percent:", fee.toString());

        const itemsArray = await Promise.all(
          Array.from({ length: parseInt(itemCount.toString()) }, (_, i) => i + 1).map((i) => fetchTokenMetadata(i))
        );

        const availableItems = itemsArray.filter(item => item !== null).map(item => ({
          ...item,
          receieved: parseFloat(item.price).toFixed(2), // Format price to 2 decimal places
        }));
        setItems(availableItems);
      } catch (error) {
        console.error("Error fetching listed items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchListedItems();
  }, [marketplace, nft, address]);
  return (
    <div className='w-full min-h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-950'>
      {!nft || !marketplace ? (
        <div className='flex justify-center items-center h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-950'>
          <p className='text-gray-500 dark:text-gray-400'>Please connect to your Metamask to view your listed NFTs.</p>
        </div>
      ) : (
        <div className='h-full p-4'>
          {loading ? (
            <div className='flex justify-center items-center h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-950'>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
              <p className='ml-2 text-gray-500 dark:text-gray-400'>Loading Listed Items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className='flex justify-center items-center h-[calc(100vh-200px)]'>
              <p className='text-gray-500 dark:text-gray-400'>No items available in the marketplace.</p>
            </div>
          ) : (
            <div>
              <p className='text-gray-600 dark:text-gray-400 mb-4'>Your Listed NFTs:</p>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {items.map((item, index) => (
                  <div key={index} className='border rounded-lg overflow-hidden shadow-md relative'>
                    <img src={item.image} alt={item.name} className='w-full h-48 object-cover' />
                    <div className='p-4 flex flex-col gap-2'>
                      <div className="flex justify-between">
                        <h2 className='text-lg font-bold dark:text-white'>{item.name}</h2>
                        <p className='text-sm font-bold dark:text-white'>Price: {item.price} ETH</p>
                      </div>
                      <p className='text-gray-600 dark:text-gray-400'>{item.description}</p>
                    </div>
                    <div className="absolute top-0 right-0 p-2">
                      {item.isSold ? (
                        <span className="bg-red-500 text-white text-xs font-bold py-1 px-2 rounded">Sold</span>
                      ) : (
                        <span className="bg-green-500 text-white text-xs font-bold py-1 px-2 rounded">Available</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          )}
        </div>
      )}
    </div>
  )
}
