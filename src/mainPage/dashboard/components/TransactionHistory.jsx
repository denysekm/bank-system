import React from "react";

/**
 * Komponenta pro zobrazení seznamu posledních transakcí.
 */
export default function TransactionHistory({ transactions, formatDateTime }) {
    return (
        <section className="card transactions-card">
            <h2 className="section-title">Poslední transakce</h2>
            {transactions.length === 0 ? (
                <div className="empty">Žádné transakce k zobrazení.</div>
            ) : (
                <div className="transactions-list scrollable-installment-container" style={{ padding: '0.5rem' }}>
                    {transactions.map((tx) => (
                        <div key={tx.id} className="transaction-item">
                            <div><span>Od:</span> <strong>{tx.sender}</strong></div>
                            <div><span>Komu:</span> <strong>{tx.receiver}</strong></div>
                            <div><span>Částka:</span> <strong>{tx.amount} Kč</strong></div>
                            <div><span>Poznámka:</span> <strong>{tx.note || "—"}</strong></div>
                            <div><span>Datum:</span> <strong>{formatDateTime(tx.transactionDate)}</strong></div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
