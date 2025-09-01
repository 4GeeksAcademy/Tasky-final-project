import React, { useState, useMemo } from "react";
import "../index.css";

const sampleOffers = [
  { id: 1, title: "Oferta 1", description: "Descripción de la oferta 1", price: 500, status: "pending" },
  { id: 2, title: "Oferta 2", description: "Descripción de la oferta 2", price: 750, status: "accepted" },
  { id: 3, title: "Oferta 3", description: "Descripción de la oferta 3", price: 1200, status: "rejected" },
  { id: 4, title: "Oferta 4", description: "Descripción de la oferta 4", price: 200, status: "pending" },
  { id: 5, title: "Oferta 5", description: "Descripción de la oferta 4", price: 2400, status: "pending" },
  { id: 6, title: "Oferta 6", description: "Descripción de la oferta 4", price: 950, status: "pending" },
];

export const MyOffers = () => {
  const [offers] = useState(sampleOffers);
  const [activeOffer, setActiveOffer] = useState(null)
  const [filter, setFilter] = useState("all")

  const filteredOffers = useMemo(() => {
    if (filter === "all") return offers;
    return offers.filter((o) => o.status === filter)
  }, [offers, filter])

  const handleOpenModal = (offer) => setActiveOffer(offer)
  const handleCloseModal = () => setActiveOffer(null)

  return (
    <div className="container mt-5">
      <h2 className="text-center">Tasky Offers</h2>

      <div className="d-flex justify-content-end my-3">
        <select
          className="form-select w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="accepted">Aceptadas</option>
          <option value="rejected">Rechazadas</option>
        </select>
      </div>

      <div className="row g-4">
        {filteredOffers.map((offer) => (
          <div key={offer.id} className="col-12 col-md-4">
            <div className="offer-card p-5 border rounded shadow-lg w-100 text-center">
              <h4>{offer.title}</h4>
              <p>{offer.description}</p>
              <p className="text-success">${offer.price}</p>
              <p>
                Estado:{" "}
                <span
                  className={
                    offer.status === "pending"
                      ? "badge bg-warning text-dark"
                      : offer.status === "accepted"
                      ? "badge bg-success"
                      : "badge bg-danger"
                  }
                >
                  {offer.status}
                </span>
              </p>
              <button
                className="btn btn-primary"
                onClick={() => handleOpenModal(offer)}
              >
                Ver detalles
              </button>
            </div>
          </div>
        ))}
        {filteredOffers.length === 0 && (
          <div className="col-12 text-center">
            <div className="alert alert-light border">
              No hay ofertas.
            </div>
          </div>
        )}
      </div>

      {activeOffer && (
        <div className="modal-backdrop">
          <div className="modal-content p-4">
            <h4>{activeOffer.title}</h4>
            <p>{activeOffer.description}</p>
            <p className="text-success">${activeOffer.price}</p>
            <div className="d-flex justify-content-between mt-3">
              <button className="btn btn-success" onClick={handleCloseModal}>
                Aceptar
              </button>
              <button className="btn btn-danger" onClick={handleCloseModal}>
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyOffers;