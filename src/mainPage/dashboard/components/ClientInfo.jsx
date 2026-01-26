import React from "react";

/**
 * Komponenta pro zobrazení základních údajů o klientovi a jeho celkového zůstatku.
 */
export default function ClientInfo({ client }) {
    if (!client) {
        return (
            <section className="card client-card">
                <h2 className="section-title">Údaje o klientovi</h2>
                <p>Data o klientovi se nepodařilo načíst.</p>
            </section>
        );
    }

    return (
        <section className="card client-card">
            <h2 className="section-title">Údaje o klientovi</h2>
            <div className="client-data-grid">
                <div className="data-item">
                    <span className="data-label">Jméno</span>
                    <span className="data-value">{client.fullName}</span>
                </div>
                <div className="data-item">
                    <span className="data-label">Číslo účtu</span>
                    <span className="data-value primary">{client.accountNumber || "—"}</span>
                </div>
                <div className="data-item">
                    <span className="data-label">Datum narození</span>
                    <span className="data-value">
                        {client.birthDate ? new Date(client.birthDate).toLocaleDateString("cs-CZ") : "—"}
                    </span>
                </div>
                <div className="data-item">
                    <span className="data-label">Adresa</span>
                    <span className="data-value">{client.address || "—"}</span>
                </div>
                <div className="data-item">
                    <span className="data-label">Doklad</span>
                    <span className="data-value">{client.passportNumber || "—"}</span>
                </div>
                <div className="data-item">
                    <span className="data-label">Typ klienta</span>
                    <span className="data-value pill-value">{client.clientType || "—"}</span>
                </div>
                <div className="data-item full-width">
                    <div className="balance-summary-wrapper">
                        <div className="balance-summary">
                            <span className="data-label">Celkem mám peněz</span>
                            <span className="balance-value">{client.totalBalance} Kč</span>
                        </div>
                        <div className="balance-breakdown">
                            <span className="breakdown-item">Debetni: <strong>{client.debitTotal} Kč</strong></span>
                            <span className="breakdown-separator">|</span>
                            <span className="breakdown-item">kreditni: <strong>{client.creditTotal} Kč</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
