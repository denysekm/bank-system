# Dokumentace Databáze Bankovního Systému

Tato dokumentace popisuje strukturu a fungování databáze tvého bankovního systému. Databáze je postavena na MySQL a skládá se ze 7 hlavních tabulek.

---

## 1. Tabulka `client` (Klienti)
Tato tabulka uchovává osobní údaje uživatelů.

| Pole | Typ | Popis |
| :--- | :--- | :--- |
| **ID** | Integer | Unikátní identifikátor klienta. |
| **FullName** | String | Celé jméno klienta. |
| **BirthDate** | String (Date) | Datum narození klienta. |
| **PassportNumber** | String | Číslo pasu nebo rodné číslo (u dětí). |
| **address** | String | Adresa bydliště (může být prázdné). |
| **phone** | String | Telefonní číslo (formát +420XXXXXXXXX). |
| **ClientType** | String | Typ klienta ("Fyzická osoba" nebo "Právnická osoba"). |
| **IsMinor** | Boolean (0/1) | Označuje, zda se jedná o nezletilou osobu (dítě). |

**Jak to funguje:** Každá osoba (včetně dětí) musí mít záznam v této tabulce, než jí může být vytvořen bankovní účet.

---

## 2. Tabulka `bank_account` (Bankovní účty)
Uchovává přihlašovací údaje a stav hlavního účtu.

| Pole | Typ | Popis |
| :--- | :--- | :--- |
| **ID** | Integer | Unikátní identifikátor účtu. |
| **ClientID** | Integer | Propojení na tabulku `client`. |
| **login** | String | Uživatelské jméno pro přihlášení (často email). |
| **password** | String | Zahashované heslo (bezpečnostní prvek). |
| **role** | String | Role uživatele (např. "ROLE_USER" nebo "ROLE_ADMIN"). |
| **ParentAccountID** | Integer | ID rodičovského účtu (u dětských účtů, jinak prázdné). |
| **MustChangeCredentials** | Boolean | Označuje, zda si uživatel musí změnit heslo při příštím přihlášení. |
| **AccountNumber** | String | Unikátní číslo bankovního účtu (např. 2000XXXXXX). |
| **Balance** | Decimal | Aktuální zůstatek na hlavním účtu (peníze, které nejsou na kartě). |
| **LastUsernameChange** | Datetime | Datum a čas poslední změny uživatelského jména (limit 30 dní). |

---

## 3. Tabulka `bank_card` (Bankovní karty)
Uchovává informace o platebních kartách.

| Pole | Typ | Popis |
| :--- | :--- | :--- |
| **ID** | Integer | Unikátní identifikátor karty. |
| **BankAccountID** | Integer | Propojení na hlavní účet. |
| **CardNumber** | String | 16místné číslo karty. |
| **CVV** | String | 3místný bezpečnostní kód. |
| **EndDate** | String (Date) | Datum platnosti karty (vystavuje se na 5 let). |
| **CardType** | String | Typ karty ("debetní" nebo "kreditní"). |
| **Brand** | String | Značka karty ("VISA" nebo "MASTERCARD"). |
| **Balance** | Decimal | Aktuální zůstatek peněz přímo na kartě. |

**Jak to funguje:** Každý účet může mít jednu debetní a jednu kreditní kartu. Debetní karta dostává při založení bonus 1,000,000 Kč.

---

## 4. Tabulka `loan_applications` (Žádosti o půjčku)
Záznamy o tom, kdo a kdy žádal o půjčku.

| Pole | Typ | Popis |
| :--- | :--- | :--- |
| **ID** | Integer | Unikátní identifikátor žádosti. |
| **BankAccountID** | Integer | Propojení na účet žadatele. |
| **RequestedAmount** | Decimal | Požadovaná částka půjčky. |
| **DurationMonths** | Integer | Doba splácení v měsících. |
| **MonthlyIncome** | Decimal | Deklarovaný měsíční příjem žadatele. |
| **OtherObligations** | Decimal | Ostatní výdaje/závazky. |
| **Status** | String | Status žádosti ("APPROVED" - schváleno, "REJECTED" - zamítnuto). |
| **RejectionReason** | String | Důvod zamítnutí (např. nízký příjem). |
| **CreatedAt** | Timestamp | Datum a čas podání žádosti. |

---

## 5. Tabulka `loans` (Půjčky)
Seznam aktivních a splacených půjček.

| Pole | Typ | Popis |
| :--- | :--- | :--- |
| **ID** | Integer | Unikátní identifikátor půjčky. |
| **ApplicationID** | Integer | Propojení na schválenou žádost. |
| **BankAccountID** | Integer | Propojení na účet dlužníka. |
| **PrincipalAmount** | Decimal | Původní půjčená částka. |
| **RemainingAmount** | Decimal | Zbývající částka k doplacení (včetně úroků). |
| **InterestRate** | Decimal | Úroková sazba (standardně 5.00 %). |
| **APR** | Decimal | RPSN (standardně 5.20 %). |
| **DurationMonths** | Integer | Celkový počet splátek. |
| **MonthlyInstallment** | Decimal | Výše jedné měsíční splátky. |
| **Status** | String | Aktuální stav ("ACTIVE" nebo "PAID"). |

---

## 6. Tabulka `loan_installments` (Splátky půjček)
Rozpis jednotlivých měsíčních plateb pro každou půjčku.

| Pole | Typ | Popis |
| :--- | :--- | :--- |
| **ID** | Integer | Unikátní identifikátor splátky. |
| **LoanID** | Integer | Propojení na konkrétní půjčku. |
| **InstallmentNumber** | Integer | Pořadové číslo splátky (např. 1 z 12). |
| **DueDate** | String (Date) | Datum splatnosti. |
| **Amount** | Decimal | Částka splátky. |
| **Status** | String | Stav splátky ("PENDING" - čeká, "PAID" - zaplaceno). |
| **PaidDate** | Datetime | Kdy byla splátka skutečně uhrazena. |

---

## 7. Tabulka `payment_transaction` (Transakce)
Historie všech pohybů peněz (převody, půjčky, splátky).

| Pole | Typ | Popis |
| :--- | :--- | :--- |
| **ID** | Integer | Unikátní identifikátor transakce. |
| **BankAccountID** | Integer | Účet, ke kterému transakce patří. |
| **Sender** | String | Číslo účtu odesílatele (nebo systémový název). |
| **Receiver** | String | Číslo účtu příjemce. |
| **Amount** | Decimal | Převedená částka. |
| **Note** | String | Poznámka k platbě. |
| **TransactionDate** | Timestamp | Datum a čas provedení transakce. |

---

### Souhrn Datových Typů
*   **Integer**: Celé číslo (např. 1, 42, 1050). Používá se pro ID a propojování tabulek.
*   **Decimal**: Desetinné číslo (např. 1500.50). Používá se pro peníze, aby byly přesné.
*   **String (VARCHAR)**: Textové pole. Používá se pro jména, hesla, čísla účtů a texty.
*   **Boolean**: Pravda/Nepravda (v MySQL často jako tinyint 0 nebo 1).
*   **Timestamp/Datetime**: Datum a čas.
