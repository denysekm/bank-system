import React, { useState, useEffect } from "react";
import { api } from "../../../../lib/api";
import { useToast } from "../../../../context/ToastContext";

export default function LoanForm({ onSuccess, buildAuthHeader, hasActiveLoan }) {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        amount: "",
        duration: "12",
        income: "",
        obligations: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasCreditCard, setHasCreditCard] = useState(true);
    const [checkingCard, setCheckingCard] = useState(true);

    useEffect(() => {
        const checkCards = async () => {
            try {
                const headers = buildAuthHeader();
                const res = await api.get("/cards/me", { headers });
                const creditCard = res.data.find(c =>
                    (c.cardType || "").toLowerCase().includes("kreditní") ||
                    (c.cardType || "").toLowerCase().includes("credit")
                );
                setHasCreditCard(!!creditCard);
            } catch (err) {
                console.error("Error checking cards:", err);
            } finally {
                setCheckingCard(false);
            }
        };
        checkCards();
    }, [buildAuthHeader]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const headers = buildAuthHeader();
            const res = await api.post("/loans/apply", {
                amount: Number(formData.amount),
                duration: Number(formData.duration),
                income: Number(formData.income),
                obligations: Number(formData.obligations || 0)
            }, { headers });

            if (res.data.ok) {
                addToast("success", "Půjčka byla schválena!");
                onSuccess();
            }
        } catch (err) {
            console.error("Apply error:", err);
            const msg = err.response?.data?.error || "Chyba při podávání žádosti.";
            setError(msg);
            addToast("error", msg);
        } finally {
            setLoading(false);
        }
    };

    if (hasActiveLoan) {
        return (
            <div className="card credits-info-card">
                <h3>Máte aktivní půjčku</h3>
                <p>V tuto chvíli nelze zažádat o další půjčku, dokud nebude ta stávající řádně splacena.</p>
            </div>
        );
    }

    if (!checkingCard && !hasCreditCard) {
        return (
            <div className="card credits-info-card border-warning">
                <h3>Chybí kreditní karta</h3>
                <p>Pro podání žádosti o půjčku musíte mít nejdříve vytvořenou <strong>kreditní kartu</strong>, na kterou vám budou peníze vyplaceny.</p>
            </div>
        );
    }

    return (
        <section className="card credits-form-card">
            <h3 className="section-title">Žádost o půjčku</h3>
            <p className="section-hint">Vyplňte základní údaje pro vyhodnocení vaší žádosti.</p>

            <form onSubmit={handleSubmit} className="form credits-form">
                <div className="transfer-grid">
                    <div className="transfer-group">
                        <label className="transfer-label">Požadovaná částka (CZK)</label>
                        <div className="transfer-input-wrapper">
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                className="transfer-input"
                                placeholder="Např. 50000"
                                required
                                min="1000"
                            />
                        </div>
                    </div>

                    <div className="transfer-group">
                        <label className="transfer-label">Doba splácení (měsíce)</label>
                        <select
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            className="field-select"
                            style={{ padding: '14px', borderRadius: '14px', height: '100%' }}
                        >
                            <option value="6">6 měsíců</option>
                            <option value="12">12 měsíců</option>
                            <option value="24">24 měsíců</option>
                            <option value="36">36 měsíců</option>
                            <option value="48">48 měsíců</option>
                        </select>
                    </div>

                    <div className="transfer-group">
                        <label className="transfer-label">Čistý měsíční příjem (CZK)</label>
                        <input
                            type="number"
                            name="income"
                            value={formData.income}
                            onChange={handleChange}
                            className="transfer-input"
                            style={{ paddingLeft: '14px' }}
                            placeholder="Např. 35000"
                            required
                        />
                    </div>

                    <div className="transfer-group">
                        <label className="transfer-label">Stávající závazky (CZK / měsíc)</label>
                        <input
                            type="number"
                            name="obligations"
                            value={formData.obligations}
                            onChange={handleChange}
                            className="transfer-input"
                            style={{ paddingLeft: '14px' }}
                            placeholder="Např. 2000 (volitelné)"
                        />
                    </div>
                </div>

                {error && <div className="inline-error">{error}</div>}

                <div className="transfer-actions">
                    <button type="submit" className="transfer-submit-btn" disabled={loading}>
                        {loading ? "Zpracovávám..." : "Odeslat žádost <span>→</span>"}
                    </button>
                </div>
            </form>
        </section>
    );
}
