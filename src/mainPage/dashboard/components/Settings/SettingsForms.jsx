import React from "react";

/**
 * Komponenta pro jeden řádek formuláře v nastavení (Premium Dark verze).
 */
const SettingsField = ({ label, children }) => (
    <div className="settings-group">
        <label className="settings-label">{label}</label>
        <div className="settings-input-wrapper">
            {children}
        </div>
    </div>
);

/**
 * Formulář pro změnu hesla.
 */
export const PasswordForm = ({ loading, onSubmit }) => (
    <section className="card settings-card">
        <h2 className="section-title">Změna hesla</h2>
        <form className="settings-form" onSubmit={onSubmit}>
            <SettingsField label="Staré heslo">
                <input className="settings-input" type="password" name="oldPassword" placeholder="Zadejte aktuální heslo" required />
            </SettingsField>

            <SettingsField label="Nové heslo">
                <input className="settings-input" type="password" name="newPassword" placeholder="Zadejte nové silné heslo" required />
            </SettingsField>

            <SettingsField label="Potvrzení hesla">
                <input className="settings-input" type="password" name="confirmPassword" placeholder="Zopakujte nové heslo" required />
            </SettingsField>

            <div className="form-actions">
                <button className="settings-submit-btn" type="submit" disabled={loading}>
                    {loading ? "Ukládám..." : "Aktualizovat heslo"}
                </button>
            </div>
        </form>
    </section>
);

/**
 * Formulář pro změnu uživatelského jména (loginu).
 */
export const UsernameForm = ({ user, loading, onSubmit }) => (
    <section className="card settings-card">
        <h2 className="section-title">Uživatelské jméno</h2>
        <p className="section-hint">
            Změna je možná jednou za 30 dní.
        </p>
        <form className="settings-form" onSubmit={onSubmit}>
            <SettingsField label="Nové jméno (login)">
                <input className="settings-input" type="text" name="newUsername" defaultValue={user?.login} placeholder="Nové uživatelské jméno" required />
            </SettingsField>

            <div className="form-actions">
                <button className="settings-submit-btn" type="submit" disabled={loading}>
                    {loading ? "Ukládám..." : "Změnit uživatelské jméno"}
                </button>
            </div>
        </form>
    </section>
);

/**
 * Formulář pro změnu adresy.
 */
export const AddressForm = ({ client, loading, onSubmit }) => (
    <section className="card settings-card">
        <h2 className="section-title">Kontaktní adresa</h2>
        <form className="settings-form" onSubmit={onSubmit}>
            <SettingsField label="Ulice, č.p., město, PSČ">
                <input className="settings-input" type="text" name="address" defaultValue={client?.address} placeholder="Vaše nová adresa" required />
            </SettingsField>

            <div className="form-actions">
                <button className="settings-submit-btn" type="submit" disabled={loading}>
                    {loading ? "Ukládám..." : "Uložit novou adresu"}
                </button>
            </div>
        </form>
    </section>
);

/**
 * Formulář pro změnu telefonního čísla.
 */
export const PhoneForm = ({ client, loading, onSubmit }) => (
    <section className="card settings-card">
        <h2 className="section-title">Mobilní telefon</h2>
        <p className="section-hint">
            Formát: <strong>+420</strong> následovaný 9 číslicemi.
        </p>
        <form className="settings-form" onSubmit={onSubmit}>
            <SettingsField label="Nové číslo">
                <input className="settings-input" type="text" name="phone" placeholder="+420123456789" defaultValue={client?.phone} required />
            </SettingsField>

            <div className="form-actions">
                <button className="settings-submit-btn" type="submit" disabled={loading}>
                    {loading ? "Ukládám..." : "Uložit telefonní číslo"}
                </button>
            </div>
        </form>
    </section>
);
