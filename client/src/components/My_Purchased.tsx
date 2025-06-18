import type { Contract } from "ethers";

const My_purchased = ({
  marketplace,
  nft
}: {
  marketplace: Contract | null;
  nft: Contract | null;
}) => {
  return (
    <div className='w-full min-h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-950'></div>
  )
}

export default My_purchased