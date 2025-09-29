import React from 'react';
import './Main.css';

function Main() {
  return (
    <main className="main">
      <h1>Vítejte v Moje Banka</h1>
      <p>Zde najdete základní přehled o svém účtu.</p>

      <section className="account">
        <h2>Můj účet</h2>
        <p><strong>Zůstatek:</strong> 12 345 Kč</p>
        <p><strong>Typ karty:</strong> Debit</p>
      </section>

      <section className="actions">
        <h2>Rychlé akce</h2>
        <button>Převod</button>
        <button>Historie</button>
        <button>Kredit</button>
      </section>

      <section className="transactions">
        <h2>Poslední transakce</h2>
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Popis</th>
              <th>Částka</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>27.09.2025</td>
              <td>Platba kartou</td>
              <td className="negative">-500 Kč</td>
            </tr>
            <tr>
              <td>26.09.2025</td>
              <td>Příjem výplaty</td>
              <td className="positive">+25 000 Kč</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}

export default Main;
