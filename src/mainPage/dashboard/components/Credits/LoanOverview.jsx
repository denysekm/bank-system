import React from "react";

export default function LoanOverview({ loan, installments, onRepay, onRepayAll }) {
    const nextInstallment = installments.find(i => i.Status === 'PENDING');
    const paidInstallments = installments.filter(i => i.Status === 'PAID').length;
    const progress = (paidInstallments / installments.length) * 100;

    const formatCurrency = (val) => Number(val).toLocaleString('cs-CZ', { style: 'currency', currency: 'CZK' });

    return (
        <div className="loan-detail-grid">
            {/* Active Loan Card */}
            <section className="card active-loan-card">
                <div className="loan-card-header">
                    <h3 className="section-title">Aktivní půjčka</h3>
                    <div className="loan-status-pill">{loan.Status}</div>
                </div>

                <div className="loan-stats">
                    <div className="loan-stat">
                        <span className="data-label">Zbývající dluh</span>
                        <span className="data-value primary">{formatCurrency(loan.RemainingAmount)}</span>
                    </div>
                    <div className="loan-stat">
                        <span className="data-label">Původní částka</span>
                        <span className="data-value">{formatCurrency(loan.PrincipalAmount)}</span>
                    </div>
                    <div className="loan-stat">
                        <span className="data-label">Úrok / RPSN</span>
                        <span className="data-value">{loan.InterestRate}% / {loan.APR}%</span>
                    </div>
                </div>

                <div className="loan-progress-container">
                    <div className="loan-progress-label">
                        <span>Splaceno {paidInstallments} z {installments.length} splátek</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="loan-progress-bar">
                        <div className="loan-progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </section>

            {/* Next Payment Card */}
            {nextInstallment && (
                <section className="card next-payment-card">
                    <h3 className="section-title">Nadcházející splátka</h3>
                    <div className="next-payment-info">
                        <div className="payment-amount">{formatCurrency(nextInstallment.Amount)}</div>
                        <div className="payment-due">Splatnost: {new Date(nextInstallment.DueDate).toLocaleDateString('cs-CZ')}</div>
                    </div>
                    <button className="btn btn-primary btn-full" onClick={onRepay} style={{ marginTop: '1.5rem', width: '100%' }}>
                        Zaplatit splátku ihned
                    </button>
                    <button className="btn btn-secondary btn-full" onClick={onRepayAll} style={{ marginTop: '0.8rem', width: '100%' }}>
                        Doplatit vše najednou
                    </button>
                </section>
            )}

            {/* Installment Table */}
            <section className="card installment-history-card">
                <h3 className="section-title">Splátkový kalendář</h3>
                <div className="installment-table-wrapper scrollable-installment-container">
                    <table className="installment-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Datum</th>
                                <th>Částka</th>
                                <th>Stav</th>
                            </tr>
                        </thead>
                        <tbody>
                            {installments.map(inst => (
                                <tr key={inst.ID} className={inst.Status === 'PAID' ? 'row-paid' : ''}>
                                    <td>{inst.InstallmentNumber}</td>
                                    <td>{new Date(inst.DueDate).toLocaleDateString('cs-CZ')}</td>
                                    <td>{formatCurrency(inst.Amount)}</td>
                                    <td>
                                        <span className={`status-tag tag-${inst.Status.toLowerCase()}`}>
                                            {inst.Status === 'PAID' ? 'Zaplaceno' : (inst.Status === 'PENDING' ? 'Čeká' : 'V prodlení')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
