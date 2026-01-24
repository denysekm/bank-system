import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((type, text, hint) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, type, text, hint }]);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {toasts.length > 0 && <div className="toast-backdrop" />}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast-item ${toast.type}`}
                        onClick={() => removeToast(toast.id)}
                    >
                        <div className={`${toast.type}-toast-box`}>
                            <button
                                className="toast-close-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeToast(toast.id);
                                }}
                            >
                                &#10005;
                            </button>
                            <div className="toast-icon">
                                {toast.type === "success" ? "✔" : "✖"}
                            </div>
                            <div className="toast-content">
                                <div className="toast-message">{toast.text}</div>
                                {toast.hint && <div className="toast-hint">{toast.hint}</div>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {children}
        </ToastContext.Provider>
    );
};
