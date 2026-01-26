import React from "react";

/**
 * Modální okno pro povinnou změnu loginu a hesla.
 * Nemá tlačítko pro zavření, čímž blokuje zbytek aplikace.
 */
export default function MandatoryCredentialsModal({
    credForm,
    credError,
    credLoading,
    onInputChange,
    onSubmit
}) {
    return (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal">
                <h3 className="modal-title">Povinná změna údajů</h3>
                <p style={{ textAlign: "center", marginBottom: "1.5rem", color: "#666" }}>
                    Pro pokračování do aplikace si prosím zvolte nový login a silné heslo.
                </p>

                <form onSubmit={onSubmit} className="form">
                    <label className="field-label">Nový login</label>
                    <input
                        className="field-input"
                        type="text"
                        name="newLogin"
                        value={credForm.newLogin}
                        onChange={onInputChange}
                        placeholder="Zadejte nový login"
                        required
                        disabled={credLoading}
                    />

                    <label className="field-label">Nové heslo</label>
                    <input
                        className="field-input"
                        type="password"
                        name="newPassword"
                        value={credForm.newPassword}
                        onChange={onInputChange}
                        placeholder="Zadejte nové heslo"
                        required
                        disabled={credLoading}
                    />

                    <label className="field-label">Potvrzení hesla</label>
                    <input
                        className="field-input"
                        type="password"
                        name="confirmPassword"
                        value={credForm.confirmPassword}
                        onChange={onInputChange}
                        placeholder="Zopakujte heslo"
                        required
                        disabled={credLoading}
                    />

                    {credError && <div className="inline-error" style={{ textAlign: "center", marginTop: "0" }}>{credError}</div>}

                    <div className="modal-actions" style={{ justifyContent: "center" }}>
                        <button className="btn btn-primary" type="submit" disabled={credLoading} style={{ width: "100%" }}>
                            {credLoading ? "Ukládám..." : "Uložit a pokračovat"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
