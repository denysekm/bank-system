import React from "react";

/**
 * Komponenta pro formulář bankovního převodu mezi účty.
 */
export default function TransferForm({ accTx, onAccTxChange, onSubmitAccTx }) {
    return (
        <section className="card transfer-card">
            <div className="section-head">
                <h2 className="section-title">Převod mezi účty</h2>
                <p className="section-hint"></p>
            </div>

            <form className="transfer-form" onSubmit={onSubmitAccTx}>
                <div className="transfer-grid">
                    <div className="transfer-group">
                        <label className="transfer-label">Z mého účtu</label>
                        <div className="transfer-input-wrapper">
                            <span className="transfer-input-icon">📤</span>
                            <input
                                className="transfer-input"
                                name="fromAccount"
                                value={accTx.fromAccount}
                                readOnly
                                placeholder="Načítám..."
                            />
                        </div>
                    </div>

                    <div className="transfer-group">
                        <label className="transfer-label">Na cílový účet</label>
                        <div className="transfer-input-wrapper">
                            <span className="transfer-input-icon">📥</span>
                            <input
                                className="transfer-input"
                                name="toAccount"
                                value={accTx.toAccount}
                                onChange={onAccTxChange}
                                placeholder="Číslo účtu příjemce"
                            />
                        </div>
                    </div>

                    <div className="transfer-group">
                        <label className="transfer-label">Částka</label>
                        <div className="transfer-input-wrapper">
                            <span className="transfer-input-icon">💰</span>
                            <input
                                className="transfer-input"
                                type="number"
                                step="0.01"
                                name="amount"
                                value={accTx.amount}
                                onChange={onAccTxChange}
                                placeholder="0.00"
                            />
                            <span className="transfer-currency">Kč</span>
                        </div>
                    </div>

                    <div className="transfer-group">
                        <label className="transfer-label">Poznámka (volitelné)</label>
                        <div className="transfer-input-wrapper">
                            <span className="transfer-input-icon">📝</span>
                            <input
                                className="transfer-input"
                                name="note"
                                value={accTx.note}
                                onChange={onAccTxChange}
                                placeholder="např. splátka / nákup"
                            />
                        </div>
                    </div>
                </div>

                <div className="transfer-actions">
                    <button className="transfer-submit-btn" type="submit">
                        Provést platbu <span>→</span>
                    </button>
                </div>
            </form>
        </section>
    );
}
