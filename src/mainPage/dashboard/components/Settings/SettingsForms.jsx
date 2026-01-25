import React from "react";

/**
 * Formulář pro změnu hesla.
 */
export const PasswordForm = ({ loading, onSubmit }) => (
    <section className="card">
        <h2 className="section-title">Změna hesla</h2>
        <form className="form" onSubmit={onSubmit}>
            <label className="field-label">Staré heslo</label>
            <input className="field-input" type="password" name="oldPassword" required />

            <label className="field-label">Nové heslo</label>
            <input className="field-input" type="password" name="newPassword" required />

            <label className="field-label">Potvrzení nového hesla</label>
            <input className="field-input" type="password" name="confirmPassword" required />

            <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Ukládám..." : "Změnit heslo"}
                </button>
            </div>
        </form>
    </section>
);

/**
 * Formulář pro změnu uživatelského jména (loginu).
 */
export const UsernameForm = ({ user, loading, onSubmit }) => (
    <section className="card">
        <h2 className="section-title">Změna uživatelského jména</h2>
        <p className="section-hint" style={{ marginBottom: "1rem" }}>
            Uživatelské jméno lze změnit pouze jednou za 30 dní.
        </p>
        <form className="form" onSubmit={onSubmit}>
            <label className="field-label">Nové uživatelské jméno (login)</label>
            <input className="field-input" type="text" name="newUsername" defaultValue={user?.login} required />

            <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Ukládám..." : "Změnit jméno"}
                </button>
            </div>
        </form>
    </section>
);

/**
 * Formulář pro změnu adresy.
 */
export const AddressForm = ({ client, loading, onSubmit }) => (
    <section className="card">
        <h2 className="section-title">Změna adresy</h2>
        <form className="form" onSubmit={onSubmit}>
            <label className="field-label">Nová adresa</label>
            <input className="field-input" type="text" name="address" defaultValue={client?.address} required />

            <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Ukládám..." : "Uložit adresu"}
                </button>
            </div>
        </form>
    </section>
);

/**
 * Formulář pro změnu telefonního čísla.
 */
export const PhoneForm = ({ client, loading, onSubmit }) => (
    <section className="card">
        <h2 className="section-title">Změna telefonního čísla</h2>
        <p className="section-hint" style={{ marginBottom: "1rem" }}>
            Telefonní číslo musí začínat <strong>+420</strong> a mít přesně 9 číslic.
            Změnu lze provést pouze jednou za 30 dní.
        </p>
        <form className="form" onSubmit={onSubmit}>
            <label className="field-label">Nové telefonní číslo</label>
            <input className="field-input" type="text" name="phone" placeholder="+420123456789" defaultValue={client?.phone} required />

            <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? "Ukládám..." : "Uložit telefon"}
                </button>
            </div>
        </form>
    </section>
);
