import React from "react";

export default function LoanHistory({ history }) {
    const formatCurrency = (val) => Number(val).toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' });

    if (history.length === 0) {
        return (
            <div className="empty-history">
                <p>Zatím jste nepodali žádnou žádost o půjčku.</p>
            </div>
        );
    }

    return (
        <section className="card history-card">
            <h3 className="section-title">Historie žádostí</h3>
            <div className="history-list">
                {history.map(app => (
                    <div key={app.ID} className={`history-item status-${app.Status.toLowerCase()}`}>
                        <div className="history-left">
                            <div className="history-amount">{formatCurrency(app.RequestedAmount)}</div>
                            <div className="history-date">{new Date(app.CreatedAt).toLocaleDateString('cs-CZ')}</div>
                        </div>
                        <div className="history-right">
                            <span className={`status-pill pill-${app.Status.toLowerCase()}`}>
                                {app.Status === 'APPROVED' ? 'Schváleno' : (app.Status === 'REJECTED' ? 'Zamítnuto' : 'V řešení')}
                            </span>
                        </div>
                        {app.RejectionReason && app.Status === 'REJECTED' && (
                            <div className="rejection-text">{app.RejectionReason}</div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
