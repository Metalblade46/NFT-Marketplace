import { NavLink } from "react-router"
import { Button } from "./ui/button"

export default function Navbar({
    toggleDarkMode,
    address,
    connect,
    disconnect,
    isDark
}: {
    toggleDarkMode: () => void
    address: string | null
    connect: () => void
    disconnect: () => void
    isDark: boolean
}) {
    return (
        <div className="w-full bg-gray-300 dark:bg-black h-16 flex justify-center items-center">
            <div className="w-full px-2 md:px-8 flex justify-between">
                <nav className="flex gap-4 items-center">
                    <h1 className="text-lg font-bold text-blue-400">NFT Marketplace</h1>
                    <div className="flex gap-4">
                        
                            <NavLink to="/" className="text-sm text-medium text-gray-500">
                                Home
                            </NavLink>
                            <NavLink to="/create" className="text-sm text-medium text-gray-500">
                                Create
                            </NavLink>
                            <NavLink to="/my-listed" className="text-sm text-medium text-gray-500">
                                My Listed Items
                            </NavLink>
                            <NavLink to="/my-purchased" className="text-sm text-medium text-gray-500">
                                My Purchased Items
                            </NavLink>
                    </div>
                        
                </nav>
                <div className="flex items-center gap-4">
                {address ? (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{address.slice(0, 6)}...{address.slice(-4)}</span>
                        <Button className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600" variant="outline" size="sm" onClick={disconnect}>Disconnect</Button>
                    </div>
                ) : (
                    <Button onClick={connect} className="bg-blue-500 text-white hover:bg-blue-600">
                        Connect Wallet
                    </Button>
                )}
                    <Button onClick={toggleDarkMode} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">
                        {isDark ? "Light Mode" : "Dark Mode"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
