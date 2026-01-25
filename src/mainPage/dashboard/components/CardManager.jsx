import React from "react";

/**
 * Komponenta pro správu a zobrazení platebních karet uživatele.
 * Zahrnuje fyzický náhled karty a tlačítko pro vytvoření nové.
 */
export default function CardManager({
    cards,
    client,
    currentCardIndex,
    setCurrentCardIndex,
    onOpenCreateCard,
    formatCardNumber
}) {
    return (
        <section className="cards-box card">
            <div className="cards-header">
                <h2 className="section-title no-margin">Moje karty</h2>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onOpenCreateCard}
                >
                    Vytvořit kartu
                </button>
            </div>

            {cards.length === 0 ? (
                <div className="empty">Zatím nemáš žádnou kartu.</div>
            ) : (
                <div className="cards-swiper">
                    <button
                        type="button"
                        className="swiper-arrow prev"
                        disabled={currentCardIndex === 0}
                        onClick={() => setCurrentCardIndex((p) => p - 1)}
                    >
                        ‹
                    </button>

                    <div className="card-physical-wrapper">
                        {cards.map((card, idx) => (
                            <div
                                key={card.id}
                                className={`card-physical ${card.cardType.toLowerCase().includes("debetní") ? "debit" : "credit"} ${idx === currentCardIndex ? "active" : ""}`}
                                style={{ display: idx === currentCardIndex ? "flex" : "none" }}
                            >
                                <div className="card-inner">
                                    <div className="card-top-row">
                                        <div className="card-chip">
                                            <div className="chip-line"></div>
                                            <div className="chip-line"></div>
                                            <div className="chip-line"></div>
                                        </div>
                                        <div className="card-brand">{card.brand}</div>
                                    </div>

                                    <div className="card-middle-row">
                                        <div className="card-number-display">
                                            {formatCardNumber(card.cardNumber)}
                                        </div>
                                    </div>

                                    <div className="card-bottom-row">
                                        <div className="card-holder-info">
                                            <span className="label">CARD HOLDER</span>
                                            <span className="value">{client?.fullName?.toUpperCase()}</span>
                                        </div>
                                        <div className="card-expiry-info">
                                            <span className="label">EXPIRES</span>
                                            <span className="value">
                                                {card.endDate ? new Date(card.endDate).toLocaleDateString("cs-CZ", { month: "2-digit", year: "2-digit" }) : "—"}
                                            </span>
                                        </div>
                                        <div className="card-cvv-info">
                                            <span className="label">CVV</span>
                                            <span className="value">***</span>
                                        </div>
                                    </div>

                                    <div className="card-type-label">{card.cardType}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="swiper-arrow next"
                        disabled={currentCardIndex === cards.length - 1}
                        onClick={() => setCurrentCardIndex((p) => p + 1)}
                    >
                        ›
                    </button>
                </div>
            )}
        </section>
    );
}
