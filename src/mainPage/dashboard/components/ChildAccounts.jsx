import React from "react";

/**
 * Komponenta pro zobrazení a správu dětských účtů.
 * Přístupná pouze pro plnoleté uživatele.
 */
export default function ChildAccounts({
    childrenAccounts,
    canCreateChildAccount,
    onOpenChildModal
}) {
    if (!canCreateChildAccount) return null;

    return (
        <section className="card children-card">
            <div className="children-header">
                <h2 className="section-title">Dětské účty</h2>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onOpenChildModal}
                >
                    Vytvořit účet pro neplnoletého
                </button>
            </div>

            {childrenAccounts.length === 0 ? (
                <div className="empty">Nemáš zatím žádné dětské účty.</div>
            ) : (
                <div className="children-list">
                    {childrenAccounts.map((ch) => (
                        <div key={ch.BankAccountID || ch.ClientID} className="child-item">
                            <div className="child-top">
                                <strong>{ch.FullName || ch.fullName}</strong>
                            </div>
                            <div className="child-row">
                                <span>ID účtu:</span> <strong>{ch.BankAccountID || ch.bankAccountId}</strong>
                            </div>
                            <div className="child-row">
                                <span>Datum narození:</span>{" "}
                                <strong>{ch.BirthDate ? new Date(ch.BirthDate).toLocaleDateString("cs-CZ") : "—"}</strong>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
