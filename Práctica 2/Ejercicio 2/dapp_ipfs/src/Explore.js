import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { addresses, abis } from './contracts/src'; // Asegúrate de tener las direcciones y ABI correctos
import { create } from 'kubo-rpc-client'; // Cliente de IPFS

const provider = new ethers.providers.Web3Provider(window.ethereum);
const ipfsContract = new ethers.Contract(addresses.nft, abis.nft, provider);

const Explore = () => {
  const [nftsForSale, setNftsForSale] = useState([]);
  const [nftsInAuction, setNftsInAuction] = useState([]);
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNFTsForSaleAndAuction = async () => {
      try {
        const signer = provider.getSigner();
        const contractWithSigner = ipfsContract.connect(signer);

        // Obtener NFTs en venta
        const saleNFTs = await contractWithSigner.getNFTsOnSale();
        setNftsForSale(saleNFTs);

        // Obtener NFTs en subasta
        const auctionNFTs = await contractWithSigner.getNFTsInAuction();
        setNftsInAuction(auctionNFTs);

        // Obtener metadatos de los NFTs
        const metadataObj = {};
        const fetchMetadata = async (nftList) => {
          for (let tokenId of nftList) {
            const tokenURI = await contractWithSigner.tokenURI(tokenId);
            const metadataResponse = await fetch(tokenURI.replace('ipfs://', 'http://0.0.0.0:8082/ipfs/'));
            const metadataJSON = await metadataResponse.json();
            metadataObj[tokenId] = metadataJSON;
          }
        };

        // Obtener los metadatos de NFTs en venta y subasta
        await fetchMetadata(saleNFTs);
        await fetchMetadata(auctionNFTs);

        setMetadata(metadataObj);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      }
    };

    fetchNFTsForSaleAndAuction();
  }, []);

  const handleBuy = async (tokenId) => {
    setLoading(true);
    try {
      const signer = provider.getSigner();
      const contractWithSigner = ipfsContract.connect(signer);
  
      // Obtener el precio del NFT directamente del contrato
      const priceInWei = await contractWithSigner.salePrices(tokenId);
      const priceInEther = ethers.utils.formatEther(priceInWei); // Convertimos a Ether para mostrar
  
      // Confirmar con el usuario
      const confirmPurchase = window.confirm(
        `The price for NFT with Token ID ${tokenId} is ${priceInEther} ETH. Do you want to proceed?`
      );
      if (!confirmPurchase) {
        setLoading(false);
        return;
      }
  
      // Llamar a la función buyNFT del contrato
      const tx = await contractWithSigner.buyNFT(tokenId, await signer.getAddress(), { value: priceInWei });
      await tx.wait(); // Esperar confirmación de la transacción
  
      alert(`Successfully purchased NFT with Token ID ${tokenId} for ${priceInEther} ETH!`);
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert(`Failed to purchase NFT: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  

  const handleBid = async (tokenId) => {
    setLoading(true);
    try {
      const signer = provider.getSigner();
      const contractWithSigner = ipfsContract.connect(signer);
  
      // Solicitar al usuario que introduzca el monto de la puja en ETH
      const bidAmount = prompt("Enter your bid amount in ETH:");
      if (!bidAmount || isNaN(bidAmount) || parseFloat(bidAmount) <= 0) {
        alert("Invalid bid amount!");
        setLoading(false);
        return;
      }
  
      // Convertir la cantidad a formato Wei para el contrato (internamente)
      const bidValueInEther = ethers.utils.parseEther(bidAmount);
  
      // Llamar a la función `bid` del contrato con el valor de la puja
      const tx = await contractWithSigner.bid(tokenId, { value: bidValueInEther });
      await tx.wait(); // Esperar confirmación de la transacción
  
      alert(`Bid placed successfully for Token ID ${tokenId} with ${bidAmount} ETH!`);
    } catch (error) {
      console.error("Error bidding on NFT:", error);
      alert(`Failed to place bid: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <h2>Explore NFTs</h2>

      {/* Mostrar NFTs en Subasta */}
      <h3>NFTs in Auction</h3>
      <div className="nft-grid">
        {nftsInAuction.length === 0 ? (
          <p>No NFTs in auction!</p>
        ) : (
          nftsInAuction.map((tokenId) => (
            <div key={tokenId.toString()} className="nft-card">
              <img
                src={metadata[tokenId]?.image?.replace('ipfs://', 'http://0.0.0.0:8082/ipfs/')}
                alt={metadata[tokenId]?.name || 'NFT Image'}
                width="200"
              />
              <p><strong>{metadata[tokenId]?.name || 'NFT Name'}</strong></p>
              <p>{metadata[tokenId]?.description || 'Description not available'}</p>
              <p><strong>Status:</strong> In Auction</p>
              <button onClick={() => handleBid(tokenId)} disabled={loading}>
                {loading ? 'Processing...' : 'Place Bid'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Mostrar NFTs a la Venta */}
      <h3>NFTs for Sale</h3>
      <div className="nft-grid">
        {nftsForSale.length === 0 ? (
          <p>No NFTs for sale!</p>
        ) : (
          nftsForSale.map((tokenId) => (
            <div key={tokenId.toString()} className="nft-card">
              <img
                src={metadata[tokenId]?.image?.replace('ipfs://', 'http://0.0.0.0:8082/ipfs/')}
                alt={metadata[tokenId]?.name || 'NFT Image'}
                width="200"
              />
              <p><strong>{metadata[tokenId]?.name || 'NFT Name'}</strong></p>
              <p>{metadata[tokenId]?.description || 'Description not available'}</p>
              <p><strong>Price:</strong> {/* Aquí deberías agregar el precio del NFT */}</p>
              <button onClick={() => handleBuy(tokenId)} disabled={loading}>
                {loading ? 'Processing...' : 'Buy NFT'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Explore;
