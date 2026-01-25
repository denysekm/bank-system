import React from "react";

/**
 * Modální okno pro vytvoření dětského účtu (pozvánku).
 */
export default function ChildInviteModal({
    show,
    onClose,
    childForm,
    childErrors,
    childLoading,
    onInputChange,
    onSubmit
}) {
    if (!show) return null;

    return (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal">
                <h3 className="modal-title">Vytvořit účet pro neplnoletého</h3>

                <form onSubmit={onSubmit} className="form">
                    <label className="field-label">Jméno a příjmení</label>
                    <input
                        className="field-input"
                        type="text"
                        name="fullName"
                        value={childForm.fullName}
                        onChange={onInputChange}
                    />
                    {childErrors.fullName && <div className="inline-error">{childErrors.fullName}</div>}

                    <label className="field-label">Rodné číslo</label>
                    <input
                        className="field-input"
                        type="text"
                        name="birthNumber"
                        value={childForm.birthNumber}
                        onChange={onInputChange}
                        placeholder="RRMMDD/XXXX"
                    />
                    {childErrors.birthNumber && <div className="inline-error">{childErrors.birthNumber}</div>}

                    <label className="field-label">Email dítěte</label>
                    <input
                        className="field-input"
                        type="email"
                        name="email"
                        value={childForm.email}
                        onChange={onInputChange}
                    />
                    {childErrors.email && <div className="inline-error">{childErrors.email}</div>}

                    <div className="modal-actions">
                        <button
                            className="btn btn-ghost"
                            type="button"
                            onClick={onClose}
                            disabled={childLoading}
                        >
                            Zrušit
                        </button>
                        <button className="btn btn-primary" type="submit" disabled={childLoading}>
                            {childLoading ? "Odesílám..." : "Vytvořit účet"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
