import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { addresses, abis } from './contracts/src';


const provider = new ethers.providers.Web3Provider(window.ethereum);
const ipfsContract = new ethers.Contract(addresses.nft, abis.nft, provider);

const MyCryptomons = () => {
  const [myNFTs, setMyNFTs] = useState([]);
  const [selectedNFT, setSelectedNFT] = useState(null); // NFT seleccionado
  const [isModalOpen, setIsModalOpen] = useState(false); // Controla el modal
  const [loading, setLoading] = useState(false); // Indica si está cargando

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();
        console.log(userAddress)
        const tokenIds = await ipfsContract.getNFTsByOwner(userAddress);
        console.log(tokenIds)
        const nftData = await Promise.all(
          tokenIds.map(async (tokenId) => {
            const tokenURI = await ipfsContract.tokenURI(tokenId);
            const response = await fetch(tokenURI.replace('ipfs://', 'http://0.0.0.0:8082/ipfs/'));
            const metadata = await response.json();
            
            // Comprobamos si está a la venta o en subasta
            const salePrice = await ipfsContract.salePrices(tokenId);
            const auction = await ipfsContract.auctions(tokenId);

            const isOnSale = salePrice > 0;
            const isInAuction = auction.auctionCloseTime > Math.floor(Date.now() / 1000) && !auction.ended;

            return { tokenId, ...metadata, isOnSale, isInAuction }
          })
        );
        setMyNFTs(nftData);

      } catch (error) {
        console.error('Error fetching NFTs:', error);
      }
    };

    fetchNFTs();
  }, []);


  const handleCardClick = async (nft) => {
    setSelectedNFT(nft);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNFT(null);
  };

  const handleAction = async (action, priceOrTime) => {
    if (!selectedNFT) return;
    setLoading(true);

    try {
      const signer = provider.getSigner();
      const contractWithSigner = ipfsContract.connect(signer);

      if (action === 'sell') {

        await contractWithSigner.putOnSale(selectedNFT.tokenId, ethers.utils.parseEther(priceOrTime.toString()));
      } else if (action === 'auction') {

        await contractWithSigner.createAuction(selectedNFT.tokenId, priceOrTime);
      }

      handleCloseModal();
    } catch (error) {
      console.error('Error performing action:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSaleOrAuction = async () => {
    if (!selectedNFT) return;
    setLoading(true);
  
    try {
      const signer = provider.getSigner();
      const contractWithSigner = ipfsContract.connect(signer);
  
      // Verificamos si está en subasta
      const auction = await ipfsContract.auctions(selectedNFT.tokenId);
      const salePrice = await ipfsContract.salePrices(selectedNFT.tokenId);
  
      if (auction.auctionCloseTime > Math.floor(Date.now() / 1000) && !auction.ended) {
        // Si la subasta no ha terminado, el propietario puede cancelarla
        if (auction.owner !== await signer.getAddress()) {
          alert('You are not the owner of this auction!');
          return;
        }
  
        // Si la subasta no ha terminado y no ha sido ganada, cancelar subasta
        await contractWithSigner.endAuction(selectedNFT.tokenId);
        alert('Auction cancelled!');
      } else if (salePrice > 0) {
        // Si el NFT está en venta, cancelar la venta
        await contractWithSigner.cancelSale(selectedNFT.tokenId);
        alert('Sale cancelled!');
      } else {
        alert('This NFT is neither for sale nor in an active auction.');
      }
  
      handleCloseModal(); // Cerrar el modal después de la cancelación
    } catch (error) {
      console.error('Error cancelling sale or auction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>My Cryptomons</h2>
      <div className="nft-grid">
        {myNFTs.length === 0 ? (
          <p>No Cryptomons found. Start by minting one!</p>
        ) : (
          myNFTs.map((nft, index) => (
            <div key={index} className="nft-card" onClick={() => handleCardClick(nft)}>
              <img src={nft.image.replace('ipfs://', 'http://0.0.0.0:8082/ipfs/')} alt={nft.name} />
              <p><strong>Title:</strong> {nft.name}</p>
              <p><strong>Description:</strong> {nft.description}</p>
            </div>
          ))
        )}
      </div>

      {isModalOpen && selectedNFT && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedNFT.name}</h3>
            <p>{selectedNFT.description}</p>
            <p><strong>Status:</strong> {selectedNFT.isOnSale ? 'For Sale' : selectedNFT.isInAuction ? 'In Auction' : 'Not Listed'}</p>
            <div>
              <input
                type="number"
                placeholder={selectedNFT.isInAuction ? "Auction Time (seconds)" : "Sale Price (ETH)"}
                onChange={(e) => setSelectedNFT({ ...selectedNFT, actionValue: e.target.value })}
              />
            </div>

            {selectedNFT.isOnSale || selectedNFT.isInAuction ? (
              <button onClick={handleCancelSaleOrAuction} disabled={loading}>
                {loading ? 'Processing...' : 'Cancel Sale/Auction'}
              </button>
            ) : (
              <>
                <button onClick={() => handleAction('sell', selectedNFT.actionValue)} disabled={loading}>
                  {loading ? 'Processing...' : 'Put for Sale'}
                </button>
                <button onClick={() => handleAction('auction', selectedNFT.actionValue)} disabled={loading}>
                  {loading ? 'Processing...' : 'Start Auction'}
                </button>
              </>
            )}

            <button onClick={handleCloseModal} disabled={loading}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCryptomons;