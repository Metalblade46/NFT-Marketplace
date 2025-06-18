import { useEffect, useState } from 'react'
import './App.css'
import { Contract, ethers } from 'ethers'
import { JsonRpcSigner } from 'ethers';
import marketPlaceAddress from "./contracts-data/Marketplace-address.json"
import marketPlaceAbi from "./contracts-data/Marketplace-abi.json"
import nftAddress from "./contracts-data/NFT-address.json"
import nftAbi from "./contracts-data/NFT-abi.json"
import { Route, Routes } from 'react-router';
import Navbar from './components/Navbar';
import Home from './components/Home';
import My_purchased from './components/My_purchased';
import My_Listed from './components/My_Listed';
import Create from './components/Create';
import Spinner from './components/ui/spinner';



function App() {
  const [isDark, setIsDark] = useState<boolean>(localStorage.getItem("darkMode") === "true" || false);
  const [address, setAddress] = useState(null);
  const [nft, setNft] = useState<Contract | null>(null);
  const [marketPlace, setMarketPlace] = useState<Contract | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    console.log("App component mounted");
    const checkConnection = async () => {
      if (window.ethereum) {
        setLoading(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_accounts' ,[]);
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          const signer = await provider.getSigner();
          loadContracts(signer);
        }else {
          setAddress(null);
          setMarketPlace(null);
          setNft(null);
        }
        // Listen for account changes
        window.ethereum.on('accountsChanged', async (accounts: any) => {
            if (accounts.length) {
              setAddress(accounts[0]);
              const provider = new ethers.BrowserProvider(window.ethereum);
              const signer = await provider.getSigner();
              loadContracts(signer);
            }
            else{
              setAddress(null);
              setMarketPlace(null);
              setNft(null);
            }
          })
        setLoading(false);
      }
    };
    checkConnection();
    return () => {
      if (window.ethereum) {
        window.ethereum.off('accountsChanged', async (accounts: any) => {
            console.log("accounts changed", accounts);
            if (accounts.length) {
              setAddress(accounts[0]);
            }
            else{
              setAddress(null);
              setMarketPlace(null);
              setNft(null);
            }
          })
      }
    }
  }, [window.ethereum]);
  const web3Handler = async () => {
    let provider;
    if (window.ethereum == null) {
      console.log("metamask is not installed")
      provider = ethers.getDefaultProvider();
    } else {
      try{
        setLoading(true);
        provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAddress(accounts[0]);
        const signer = await provider.getSigner();
        loadContracts(signer);
        setLoading(false);
      }catch (error) {
        console.error("Error connecting to wallet:", error);
        setLoading(false);
      }
    }
  }
  const loadContracts = (signer: JsonRpcSigner) => {
    const marketPlaceContract = new ethers.Contract(marketPlaceAddress.address, marketPlaceAbi.abi, signer);
    setMarketPlace(marketPlaceContract);
    const nftContract = new ethers.Contract(nftAddress.address, nftAbi.abi, signer);
    setNft(nftContract);
  }
  const toggleDarkMode = () => {
    setIsDark(dark => !dark);
    localStorage.setItem("darkMode", (!isDark).toString());
  }
  const disconnect = async () => {
    await window.ethereum.request({
      method: "wallet_revokePermissions",
      params: [
        {
          eth_accounts: {},
        },
      ],
    })
    setAddress(null);
    setMarketPlace(null);
    setNft(null);
    setLoading(false);
  }
  return (
    <div className={isDark ? "dark" : ""}>
      <Navbar toggleDarkMode={toggleDarkMode} address={address} connect={web3Handler} disconnect={disconnect} isDark={isDark} />
      {loading ? (
        <div className='flex justify-center items-center h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-950'>
          <Spinner />
          <p className='ml-2 text-gray-500 dark:text-gray-400'>Loading Metamask...</p>
        </div>
      ) : (
        <Routes>
          <Route path='/' element={<Home marketplace={marketPlace as Contract} nft={nft as Contract} connectWallet= {web3Handler} />} />
          <Route path='/create' element={<Create marketplace={marketPlace as Contract} nft={nft as Contract} />} />
          <Route path='/my-listed' element={<My_Listed marketplace={marketPlace as Contract} nft={nft as Contract} address={address} />} />
          <Route path='/my-purchased' element={<My_purchased marketplace={marketPlace as Contract} nft={nft as Contract} />} />
        </Routes>
      )}
    </div>
  )
}

export default App
