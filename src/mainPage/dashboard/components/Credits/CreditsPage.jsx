import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../../../lib/api";
import { useToast } from "../../../../context/ToastContext";
import LoanForm from "./LoanForm";
import LoanOverview from "./LoanOverview";
import LoanHistory from "./LoanHistory";
import "./Credits.css";

export default function CreditsPage({ user, client, buildAuthHeader, onActionComplete }) {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activeLoan, setActiveLoan] = useState(null);
    const [installments, setInstallments] = useState([]);
    const [history, setHistory] = useState([]);
    const [view, setView] = useState("overview"); // overview | apply | history

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const headers = buildAuthHeader();
            const [activeRes, historyRes] = await Promise.all([
                api.get("/loans/active", { headers }),
                api.get("/loans/history", { headers })
            ]);

            setActiveLoan(activeRes.data.activeLoan);
            setInstallments(activeRes.data.installments || []);
            setHistory(historyRes.data || []);

            // User requested that after taking a loan, history view should be default
            if (activeRes.data.activeLoan) {
                setView("overview");
            } else {
                setView("apply");
            }
        } catch (err) {
            console.error("Error fetching loan data:", err);
            // Default to apply view if data can't be fetched (likely tables not exists yet)
            setView("apply");
            // Only show toast for non-table errors to reduce noise
            if (err.response?.data?.error && !err.response.data.error.includes("exist")) {
                addToast("error", "Nepodařilo se načíst data o půjčkách.");
            }
        } finally {
            setLoading(false);
        }
    }, [buildAuthHeader, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRepay = async () => {
        try {
            const headers = buildAuthHeader();
            await api.post("/loans/repay", {}, { headers });
            addToast("success", "Splátka byla úspěšně uhrazena.");
            fetchData();
            if (onActionComplete) onActionComplete();
        } catch (err) {
            addToast("error", err.response?.data?.error || "Chyba při splácení.");
        }
    };

    const handleRepayAll = async () => {
        if (!window.confirm("Opravdu si přejete doplatit celou půjčku najednou?")) return;
        try {
            const headers = buildAuthHeader();
            await api.post("/loans/repay-all", {}, { headers });
            addToast("success", "Půjčka byla kompletně splacena.");
            fetchData();
            if (onActionComplete) onActionComplete();
        } catch (err) {
            addToast("error", err.response?.data?.error || "Chyba při úplném splácení.");
        }
    };

    const handleApplySuccess = () => {
        addToast("success", "Půjčka byla schválena a vyplacena.");
        fetchData();
        if (onActionComplete) onActionComplete();
    };

    if (loading) return <div className="credits-loading">Načítání...</div>;

    return (
        <div className="credits-container">
            <div className="credits-header">
                <h2 className="section-title">Centrum půjček</h2>
                <div className="credits-nav">
                    {activeLoan && (
                        <button
                            className={`credits-nav-btn ${view === "overview" ? "active" : ""}`}
                            onClick={() => setView("overview")}
                        >
                            Moje půjčka
                        </button>
                    )}
                    <button
                        className={`credits-nav-btn ${view === "apply" ? "active" : ""}`}
                        onClick={() => setView("apply")}
                    >
                        Nová žádost
                    </button>
                    <button
                        className={`credits-nav-btn ${view === "history" ? "active" : ""}`}
                        onClick={() => setView("history")}
                    >
                        Historie žádostí
                    </button>
                </div>
            </div>

            <div className="credits-content">
                {client?.isMinor && view === "apply" ? (
                    <div className="card minor-restriction-card">
                        <h2 className="section-title">Omezení účtu</h2>
                        <p>Dětské účty nemohou žádat o bankovní půjčky. Tato funkce je dostupná pouze pro plnoleté klienty.</p>
                    </div>
                ) : (
                    <>
                        {view === "overview" && activeLoan && (
                            <LoanOverview
                                loan={activeLoan}
                                installments={installments}
                                onRepay={handleRepay}
                                onRepayAll={handleRepayAll}
                            />
                        )}
                        {view === "apply" && (
                            <LoanForm
                                onSuccess={handleApplySuccess}
                                buildAuthHeader={buildAuthHeader}
                                hasActiveLoan={!!activeLoan}
                            />
                        )}
                        {view === "history" && (
                            <LoanHistory history={history} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
