import React, { useState, useEffect } from "react";
import axios from "axios";
import Papa from "papaparse";
import "./App.css";

const CreditCardDropdown = () => {
  const [creditCards, setCreditCards] = useState([]);
  const [debitCards, setDebitCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState("");
  const [pvrOffers, setPvrOffers] = useState([]);
  const [inoxOffers, setInoxOffers] = useState([]);
  const [bookMyShowOffers, setBookMyShowOffers] = useState([]);
  const [movieDebitOffers, setMovieDebitOffers] = useState([]);
  const [movieBenefits, setMovieBenefits] = useState([]);
  const [expandedOfferIndex, setExpandedOfferIndex] = useState({ 
    pvr: null, 
    inox: null, 
    bms: null 
  });

  const toggleOfferDetails = (type, index) => {
    setExpandedOfferIndex(prev => ({
      ...prev,
      [type]: prev[type] === index ? null : index
    }));
  };

  useEffect(() => {
    const fetchCSVData = async () => {
      try {
        // Load all CSV files
        const [pvrResponse, inoxResponse, bmsResponse, debitResponse, benefitsResponse] = await Promise.all([
          axios.get("/Pvr final.csv"),
          axios.get("/Inox final.csv"),
          axios.get("/Book My Show final.csv"),
          axios.get("/Final_Cleaned_Movie_Offers.csv"),
          axios.get("/Movie_Benefits_List_With_Images.csv")
        ]);

        // Parse all CSV data
        const pvrData = Papa.parse(pvrResponse.data, { header: true });
        const inoxData = Papa.parse(inoxResponse.data, { header: true });
        const bmsData = Papa.parse(bmsResponse.data, { header: true });
        const debitData = Papa.parse(debitResponse.data, { header: true });
        const benefitsData = Papa.parse(benefitsResponse.data, { header: true });

        // Set offers data
        setPvrOffers(pvrData.data);
        setInoxOffers(inoxData.data);
        setBookMyShowOffers(bmsData.data);
        setMovieDebitOffers(debitData.data);
        setMovieBenefits(benefitsData.data);

        // Collect all unique credit cards from Movie_Benefits_List_With_Images.csv
        const benefitsCreditCards = new Set();
        benefitsData.data.forEach(row => {
          if (row["Credit Card Name"]) {
            benefitsCreditCards.add(row["Credit Card Name"].trim());
          }
        });

        // Collect all unique credit cards from other sources
        const otherCreditCards = new Set();
        
        pvrData.data.forEach(row => {
          if (row["Credit Card"]) {
            otherCreditCards.add(row["Credit Card"].trim());
          }
        });
        
        inoxData.data.forEach(row => {
          if (row["Credit Card"]) {
            otherCreditCards.add(row["Credit Card"].trim());
          }
        });
        
        bmsData.data.forEach(row => {
          if (row["Credit Card"]) {
            otherCreditCards.add(row["Credit Card"].trim());
          }
        });

        // Combine both sets of credit cards
        const allCreditCards = new Set([...benefitsCreditCards, ...otherCreditCards]);

        // Collect all unique debit cards
        const allDebitCards = new Set();
        debitData.data.forEach(row => {
          if (row["Applicable Debit Cards"]) {
            row["Applicable Debit Cards"].split(",").forEach(card => {
              allDebitCards.add(card.trim());
            });
          }
        });

        setCreditCards(Array.from(allCreditCards).sort());
        setDebitCards(Array.from(allDebitCards).sort());
      } catch (error) {
        console.error("Error loading CSV data:", error);
      }
    };

    fetchCSVData();
  }, []);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setQuery(value);

    if (value) {
      // Split the query into individual words
      const queryWords = value.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      
      const filteredCredit = creditCards.filter((card) => {
        const cardLower = card.toLowerCase();
        // Check if all query words appear in the card name (in any order)
        return queryWords.every(word => cardLower.includes(word));
      });
      
      const filteredDebit = debitCards.filter((card) => {
        const cardLower = card.toLowerCase();
        // Check if all query words appear in the card name (in any order)
        return queryWords.every(word => cardLower.includes(word));
      });

      const combinedResults = [];
      if (filteredCredit.length > 0) {
        combinedResults.push({ type: "heading", label: "Credit Cards" });
        combinedResults.push(...filteredCredit.map((card) => ({ type: "credit", card })));
      }
      if (filteredDebit.length > 0) {
        combinedResults.push({ type: "heading", label: "Debit Cards" });
        combinedResults.push(...filteredDebit.map((card) => ({ type: "debit", card })));
      }

      setFilteredCards(combinedResults);
    } else {
      setFilteredCards([]);
    }
  };

  const handleCardSelection = (card) => {
    setSelectedCard(card);
    setQuery(card);
    setFilteredCards([]);
    setExpandedOfferIndex({ pvr: null, inox: null, bms: null });
  };

  const getOffersForSelectedCard = (offers, isDebit = false) => {
    return offers.filter((offer) => {
      if (isDebit) {
        return (
          offer["Applicable Debit Cards"] &&
          offer["Applicable Debit Cards"].split(",").map((c) => c.trim()).includes(selectedCard)
        );
      } else {
        return offer["Credit Card"] && offer["Credit Card"].trim() === selectedCard;
      }
    });
  };

  const getMovieBenefitsForSelectedCard = () => {
    return movieBenefits.filter(offer => {
      const cardName = offer["Credit Card Name"] ? offer["Credit Card Name"].trim() : "";
      return cardName.toLowerCase() === selectedCard.toLowerCase();
    });
  };

  const selectedPvrOffers = getOffersForSelectedCard(pvrOffers);
  const selectedInoxOffers = getOffersForSelectedCard(inoxOffers);
  const selectedBookMyShowOffers = getOffersForSelectedCard(bookMyShowOffers);
  const selectedMovieDebitOffers = getOffersForSelectedCard(movieDebitOffers, true);
  const selectedMovieBenefits = getMovieBenefitsForSelectedCard();

  return (
    <div className="App">
        {/* Navbar Component */}
      <nav className="navbar">
        <div className="logoContainer">
          <a href="https://www.myrupaya.in/">
            <img
              src="https://static.wixstatic.com/media/f836e8_26da4bf726c3475eabd6578d7546c3b2~mv2.jpg/v1/crop/x_124,y_0,w_3152,h_1458/fill/w_909,h_420,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/dark_logo_white_background.jpg"
              alt="MyRupaya Logo"
              className="logo"
            />
          </a>
          <div className="linksContainer">
            <a href="https://www.myrupaya.in/" className="link">
              Home
            </a>
          </div>
        </div>
      </nav>


      <h1>Movies Offers</h1>
      <div className="creditCardDropdown" style={{ position: "relative", width: "600px", margin: "0 auto" }}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Type a Credit/Debit Card..."
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
        {filteredCards.length > 0 && (
          <ul
            style={{
              listStyleType: "none",
              padding: "10px",
              margin: 0,
              width: "100%",
              maxHeight: "200px",
              overflowY: "auto",
              border: "1px solid #ccc",
              borderRadius: "5px",
              backgroundColor: "#fff",
              position: "absolute",
              zIndex: 1000,
            }}
          >
            {filteredCards.map((item, index) =>
              item.type === "heading" ? (
                <li key={index} className="dropdown-heading">
                  <strong>{item.label}</strong>
                </li>
              ) : (
                <li
                  key={index}
                  onClick={() => handleCardSelection(item.card)}
                  style={{
                    padding: "10px",
                    cursor: "pointer",
                    borderBottom:
                      index !== filteredCards.length - 1
                        ? "1px solid #eee"
                        : "none",
                  }}
                  onMouseOver={(e) =>
                    (e.target.style.backgroundColor = "#f0f0f0")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.backgroundColor = "transparent")
                  }
                >
                  {item.card}
                </li>
              )
            )}
          </ul>
        )}
      </div>

      {selectedCard && (
        <div className="offer-section">
          {selectedMovieBenefits.length > 0 && (
            <div className="offer-container">
              <h2 style={{ textAlign: "center", margin: "20px 0" }}>Permanent Offers on {selectedCard}</h2>
              <div className="offer-row">
                {selectedMovieBenefits.map((benefit, index) => (
                  <div key={`benefit-${index}`} className="offer-card"  style={{backgroundColor:" #39641D", color:"white"}}>
                    {benefit.image && (
                      <img 
                        src={benefit.image} 
                        alt={benefit["Credit Card Name"] || "Card Offer"} 
                        style={{ 
                          maxWidth: "100%", 
                          height: "auto",
                          maxHeight: "150px",
                          objectFit: "contain",
                          color:"white"
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder-image.jpg";
                        }}
                      />
                    )}
                    <h3 >{benefit["Credit Card Name"] || "Card Offer"}</h3>
                    {benefit["Movie Benefit"] && <p><strong>Benefit:</strong> {benefit["Movie Benefit"]}</p>}
                    {benefit.Terms && <p><strong>Terms:</strong> {benefit.Terms}</p>}
                    {benefit.Link && (
                      <button 
                        onClick={() => window.open(benefit.Link, "_blank")}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          marginTop: "10px"
                        }}
                      >
                        View Details
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedPvrOffers.length > 0 && (
            <div className="offer-container">
              <h2>PVR Offers</h2>
              <div className="offer-row">
                {selectedPvrOffers.map((offer, index) => (
                  <div key={`pvr-${index}`} className="offer-card"  style={{backgroundColor:" #39641D", color:"white"}}>
                    {offer.Image && (
                      <img 
                        src={offer.Image} 
                        alt={offer.Title || "PVR Offer"} 
                        style={{ 
                          maxWidth: "100%", 
                          height: "auto",
                          maxHeight: "150px",
                          objectFit: "contain"
                        }} 
                      />
                    )}
                    <h3>{offer.Title || "PVR Offer"}</h3>
                    {offer.Validity && <p><strong>Validity:</strong> {offer.Validity}</p>}
                    
                    {expandedOfferIndex.pvr === index && (
                      <div className="terms-container" style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        border: "1px solid #ddd",
                        padding: "10px",
                        margin: "10px 0",
                        borderRadius: "4px",
                        backgroundColor: "#f9f9f9",
                        color:"black"
                      }}>
                        <h4>Offer Details:</h4>
                        <p>{offer.Offers}</p>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => toggleOfferDetails("pvr", index)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: expandedOfferIndex.pvr === index ? "#6c757d" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        marginTop: "10px"
                      }}
                    >
                      {expandedOfferIndex.pvr === index ? "Hide Details" : "Click For More Details"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedInoxOffers.length > 0 && (
            <div className="offer-container">
              <h2>INOX Offers</h2>
              <div className="offer-row">
                {selectedInoxOffers.map((offer, index) => (
                  <div key={`inox-${index}`} className="offer-card"  style={{backgroundColor:" #39641D", color:"white"}}>
                    {offer.Image && (
                      <img 
                        src={offer.Image} 
                        alt={offer.Title || "INOX Offer"} 
                        style={{ 
                          maxWidth: "100%", 
                          height: "auto",
                          maxHeight: "150px",
                          objectFit: "contain"
                        }} 
                      />
                    )}
                    <h3>{offer.Title || "INOX Offer"}</h3>
                    {offer.Validity && <p><strong>Validity:</strong> {offer.Validity}</p>}
                    
                    {expandedOfferIndex.inox === index && (
                      <div className="terms-container" style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        border: "1px solid #ddd",
                        padding: "10px",
                        margin: "10px 0",
                        borderRadius: "4px",
                        backgroundColor: "#f9f9f9",
                        color:"black"
                      }}>
                        <h4>Offer Details:</h4>
                        <p>{offer.Offers}</p>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => toggleOfferDetails("inox", index)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: expandedOfferIndex.inox === index ? "#6c757d" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        marginTop: "10px"
                      }}
                    >
                      {expandedOfferIndex.inox === index ? "Hide Details" : "Click For More Details"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedBookMyShowOffers.length > 0 && (
            <div className="offer-container">
              <h2>BookMyShow Offers</h2>
              <div className="offer-row">
                {selectedBookMyShowOffers.map((offer, index) => (
                  <div key={`bms-${index}`} className="offer-card"  style={{backgroundColor:" #39641D", color:"white"}}>
                    {offer.Image && (
                      <img 
                        src={offer.Image} 
                        alt={offer.Title || "BookMyShow Offer"} 
                        style={{ 
                          maxWidth: "100%", 
                          height: "auto",
                          maxHeight: "150px",
                          objectFit: "contain"
                        }} 
                      />
                    )}
                    <h3>{offer.Title || "BookMyShow Offer"}</h3>
                    {offer.Offer && <p><strong>Offer:</strong> {offer.Offer}</p>}
                    {offer.Validity && <p><strong>Validity:</strong> {offer.Validity}</p>}
                    
                    {expandedOfferIndex.bms === index && (
                      <div className="terms-container" style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        border: "1px solid #ddd",
                        padding: "10px",
                        margin: "10px 0",
                        borderRadius: "4px",
                        backgroundColor: "#f9f9f9",
                        color:"black"
                        
                      }}>
                        <h4>Offer Details:</h4>
                        <p>{offer.Offers || "No additional details available"}</p>
                      </div>
                    )}
                    
                    {offer.Link ? (
                      <button 
                        onClick={() => window.open(offer.Link, "_blank")}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          marginTop: "10px"
                        }}
                      >
                        View Details
                      </button>
                    ) : (
                      <button 
                        onClick={() => toggleOfferDetails("bms", index)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: expandedOfferIndex.bms === index ? "#6c757d" : "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          marginTop: "10px"
                        }}
                      >
                        {expandedOfferIndex.bms === index ? "Hide Details" : "Click For More Details"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedMovieDebitOffers.length > 0 && (
            <div className="offer-container">
              <h2>Debit Card Offers</h2>
              <div className="offer-row">
                {selectedMovieDebitOffers.map((offer, index) => (
                  <div key={`debit-${index}`} className="offer-card"  style={{backgroundColor:" #39641D", color:"white"}}>
                    {offer.Image && (
                      <img 
                        src={offer.Image} 
                        alt={offer.Website || "Debit Card Offer"} 
                        style={{ 
                          maxWidth: "100%", 
                          height: "auto",
                          maxHeight: "150px",
                          objectFit: "contain"
                        }} 
                      />
                    )}
                    <h3>{offer.Website || "Debit Card Offer"}</h3>
                    {offer.Offer && <p>{offer.Offer}</p>}
                    {offer.Link && (
                      <button 
                        onClick={() => window.open(offer.Link, "_blank")}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          marginTop: "10px"
                        }}
                      >
                        View Details
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreditCardDropdown;