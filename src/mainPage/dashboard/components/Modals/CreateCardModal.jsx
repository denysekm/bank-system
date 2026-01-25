import React from "react";

/**
 * Modální okno pro vytvoření nové platební karty.
 */
export default function CreateCardModal({
    show,
    onClose,
    newCardType,
    setNewCardType,
    newCardBrand,
    setNewCardBrand,
    onConfirm
}) {
    if (!show) return null;

    return (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal">
                <h3 className="modal-title">Vytvořit kartu</h3>

                <label className="field-label">Typ karty</label>
                <select className="field-select" value={newCardType} onChange={(e) => setNewCardType(e.target.value)}>
                    <option value="debetní">debetní</option>
                    <option value="kreditní">kreditní</option>
                </select>

                <label className="field-label">Značka karty</label>
                <select className="field-select" value={newCardBrand} onChange={(e) => setNewCardBrand(e.target.value)}>
                    <option value="VISA">VISA</option>
                    <option value="MASTERCARD">MASTERCARD</option>
                </select>

                <div className="modal-actions">
                    <button className="btn btn-ghost" onClick={onClose}>Zrušit</button>
                    <button className="btn btn-primary" onClick={onConfirm}>Potvrdit</button>
                </div>
            </div>
        </div>
    );
}
