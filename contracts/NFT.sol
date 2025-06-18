// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC721URIStorage , ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {
    uint256 public nextTokenId;

    constructor() ERC721("MyNFT", "MNFT") {
        nextTokenId = 0;
    }

    function createNFT(string memory tokenURI) external returns (uint256){
        nextTokenId++;
        _safeMint(msg.sender,nextTokenId);
        _setTokenURI(nextTokenId,tokenURI);
        return nextTokenId;
    }
}
