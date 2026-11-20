import {
  formatBalance,
  formatMoney,
  formatNumericDate,
  formatShortDate,
  summarizePerson,
  toDateKey,
  withBalance,
} from './format';
import { ledgerTerms } from './terms';
import { Entry, EntryWithBalance, Person } from './types';

export type StatementModel = {
  person: Person;
  rows: EntryWithBalance[];
  gave: number;
  received: number;
  balance: number;
  toReceive: number;
  toGive: number;
  generatedAt: Date;
  periodStart: string | null;
  periodEnd: string | null;
  accountSince: string;
};

export function getStatementModel(person: Person, entries: Entry[], now = new Date()): StatementModel {
  const summary = summarizePerson(person, entries);
  const rows = withBalance(entries);
  const periodStart = rows.length > 0 ? rows[0].date : null;
  const periodEnd = rows.length > 0 ? rows[rows.length - 1].date : null;

  return {
    person,
    rows,
    gave: summary.gave,
    received: summary.received,
    balance: summary.balance,
    toReceive: Math.max(summary.balance, 0),
    toGive: Math.max(-summary.balance, 0),
    generatedAt: now,
    periodStart,
    periodEnd,
    accountSince: person.createdAt,
  };
}

export function statementFileName(person: Person, now = new Date()) {
  return `Folio-${safePersonName(person)}-${formatNumericDate(now)}.pdf`;
}

export function snapshotFileName(person: Person, now = new Date()) {
  return `Folio-${safePersonName(person)}-${formatNumericDate(now)}.png`;
}

function safePersonName(person: Person) {
  const safeName = person.name
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return safeName || 'Statement';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPeriod(model: StatementModel) {
  if (!model.periodStart || !model.periodEnd) return 'No entries yet';
  if (model.periodStart === model.periodEnd) return formatShortDate(model.periodStart);
  return `${formatShortDate(model.periodStart)} – ${formatShortDate(model.periodEnd)}`;
}

export type StatementOptions = {
  /** Uses debit/credit wording instead of gave/received. */
  creditTerms?: boolean;
  /** Name printed on the statement as the sender. */
  statementName?: string;
};

export function buildStatementHtml(
  person: Person,
  entries: Entry[],
  now = new Date(),
  options: StatementOptions = {},
) {
  const terms = ledgerTerms(options.creditTerms ?? false);
  const sender = (options.statementName ?? '').trim();
  const model = getStatementModel(person, entries, now);
  const rowsHtml =
    model.rows.length === 0
      ? `<tr><td colspan="5" class="empty">No entries recorded yet.</td></tr>`
      : [...model.rows]
          .reverse()
          .map((row) => {
            const details = [row.note, row.method].filter(Boolean).join(' · ');
            return `
              <tr>
                <td class="date">${escapeHtml(formatShortDate(row.date).replace(/ \d{4}$/, ''))}</td>
                <td class="details">
                  <div class="entry-kind ${row.type === 'gave' ? 'gave' : 'received'}">
                    ${row.type === 'gave' ? terms.gave : terms.received}
                  </div>
                  ${details ? `<div class="entry-note">${escapeHtml(details)}</div>` : '<div class="entry-note muted">No details</div>'}
                </td>
                <td class="money gave">${row.type === 'gave' ? formatMoney(row.amount) : '—'}</td>
                <td class="money received">${row.type === 'received' ? formatMoney(row.amount) : '—'}</td>
                <td class="money balance">${formatBalance(row.balance)}</td>
              </tr>`;
          })
          .join('');

  const netCopy =
    Math.abs(model.balance) < 0.01
      ? 'All settled up'
      : model.balance > 0
        ? `You'll receive ${formatMoney(model.balance)}`
        : `You'll give ${formatMoney(model.balance)}`;

  const netTone = Math.abs(model.balance) < 0.01 ? 'settled' : model.balance > 0 ? 'green' : 'red';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Folio statement — ${escapeHtml(person.name)}</title>
    <style>
      * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4; margin: 18mm 16mm; }
      html, body { margin: 0; padding: 0; }
      body {
        font-family: Roboto, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
        color: #14181f;
        background: #ffffff;
        font-size: 13px;
        line-height: 1.45;
        -webkit-text-size-adjust: 100%;
      }
      .page { max-width: none; margin: 0 auto; }
      .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
      .brand { display: flex; align-items: center; gap: 11px; }
      .mark {
        width: 38px; height: 38px; border-radius: 12px; background: #14181f; color: #ffffff;
        font-size: 21px; font-weight: 700; display: flex; align-items: center; justify-content: center;
        position: relative;
      }
      .mark::after {
        content: ""; position: absolute; width: 6px; height: 6px; border-radius: 50%;
        background: #8ce0a8; right: 7px; bottom: 7px;
      }
      .brand-name { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
      .brand-tag { font-size: 9px; letter-spacing: 1.4px; color: #98a1af; margin-top: 1px; font-weight: 500; }
      .doc { text-align: right; }
      .doc-title { font-size: 10px; font-weight: 700; letter-spacing: 1.4px; color: #6b7686; }
      .doc-date { font-size: 12px; color: #3c4553; margin-top: 5px; }
      .rule { height: 1px; background: #d7dee8; margin: 20px 0 18px; }
      .meta { display: flex; justify-content: space-between; gap: 24px; }
      .micro { font-size: 9.5px; letter-spacing: 1.1px; color: #98a1af; font-weight: 700; text-transform: uppercase; }
      .person-name { font-size: 26px; font-weight: 700; letter-spacing: -0.7px; margin-top: 5px; line-height: 1.15; }
      .meta-line { font-size: 12px; color: #6b7686; margin-top: 4px; }
      .sender { font-size: 12.5px; font-weight: 500; color: #14181f; margin-top: 6px; }
      .sender span { color: #98a1af; font-weight: 400; margin-right: 4px; }
      .meta-right { text-align: right; min-width: 180px; }
      .period { font-size: 14px; font-weight: 500; margin-top: 10px; }
      .summary {
        display: flex; gap: 26px; margin-top: 24px; padding: 15px 0;
        border-top: 1px solid #d7dee8; border-bottom: 1px solid #d7dee8;
      }
      .sum { flex: 1; }
      .sum + .sum { border-left: 1px solid #e6eaf0; padding-left: 26px; }
      .sum-amount { font-size: 22px; font-weight: 700; letter-spacing: -0.6px; margin-top: 5px; line-height: 1.2; }
      .sum-green .sum-amount { color: #0a7a4b; }
      .sum-red .sum-amount { color: #c42b2b; }
      .sum-copy { font-size: 11.5px; color: #6b7686; margin-top: 3px; }
      .net {
        display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
        padding: 14px 0 4px;
      }
      .net-label { font-size: 10px; letter-spacing: 1.2px; color: #6b7686; font-weight: 700; }
      .net-value { font-size: 15px; font-weight: 700; letter-spacing: -0.2px; }
      .net-value.green { color: #0a7a4b; }
      .net-value.red { color: #c42b2b; }
      .net-value.settled { color: #6b7686; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      thead { display: table-header-group; }
      th {
        font-size: 10px; letter-spacing: 0.8px; text-transform: uppercase; color: #6b7686;
        text-align: left; padding: 9px 6px; border-bottom: 1px solid #b9c2d0; font-weight: 700;
      }
      th.amount, td.money { text-align: right; }
      td { padding: 11px 6px; border-bottom: 1px solid #e6eaf0; vertical-align: top; }
      tr { page-break-inside: avoid; }
      .date { width: 12%; font-size: 11.5px; color: #6b7686; white-space: nowrap; }
      .details { width: 37%; }
      .entry-kind { font-size: 12.5px; font-weight: 500; }
      .entry-kind.gave { color: #c42b2b; }
      .entry-kind.received { color: #0a7a4b; }
      .entry-note { font-size: 11px; color: #6b7686; margin-top: 2px; line-height: 1.35; }
      .entry-note.muted { color: #98a1af; }
      .money { font-size: 12px; white-space: nowrap; font-variant-numeric: tabular-nums; }
      td.gave { color: #c42b2b; }
      td.received { color: #0a7a4b; }
      td.balance { color: #14181f; font-weight: 700; }
      tr.empty td { padding: 32px 6px; text-align: center; color: #98a1af; }
      .closing {
        display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
        margin-top: 18px; padding: 14px 0; border-top: 1px solid #b9c2d0; border-bottom: 1px solid #d7dee8;
      }
      .closing-label { font-size: 10.5px; letter-spacing: 1px; color: #6b7686; font-weight: 700; }
      .closing-value { font-size: 18px; font-weight: 700; letter-spacing: -0.4px; }
      .closing-value.green { color: #0a7a4b; }
      .closing-value.red { color: #c42b2b; }
      .closing-value.settled { color: #6b7686; }
      .footnote { margin-top: 18px; font-size: 11px; line-height: 1.5; color: #6b7686; }
      .footer {
        margin-top: 28px; padding-top: 12px; border-top: 1px solid #e6eaf0;
        display: flex; justify-content: space-between; gap: 20px;
        font-size: 10px; color: #98a1af;
      }
      @media print {
        body { font-size: 12.5px; }
        .rule { margin: 16px 0 14px; }
        .summary { margin-top: 20px; padding: 12px 0; }
        .net { padding-top: 10px; }
        table { margin-top: 12px; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div class="brand">
          <div class="mark">F</div>
          <div>
            <div class="brand-name">Folio</div>
            <div class="brand-tag">PERSONAL LEDGER</div>
          </div>
        </div>
        <div class="doc">
          <div class="doc-title">ACCOUNT STATEMENT</div>
          <div class="doc-date">${escapeHtml(formatNumericDate(now))}</div>
        </div>
      </div>

      <div class="rule"></div>

      <div class="meta">
        <div>
          <div class="micro">Statement for</div>
          <div class="person-name">${escapeHtml(person.name)}</div>
          <div class="meta-line">${person.phone ? escapeHtml(person.phone) : 'No contact number added'}</div>
          <div class="meta-line">Account since ${escapeHtml(formatShortDate(toDateKey(new Date(model.accountSince))))}</div>
          ${sender ? `<div class="sender"><span>From</span>${escapeHtml(sender)}</div>` : ''}
        </div>
        <div class="meta-right">
          <div class="micro">Statement period</div>
          <div class="period">${escapeHtml(formatPeriod(model))}</div>
          <div class="meta-line">${model.rows.length} ${model.rows.length === 1 ? 'entry' : 'entries'}</div>
        </div>
      </div>

      <div class="summary">
        <div class="sum sum-green">
          <div class="micro">To receive</div>
          <div class="sum-amount">${formatMoney(model.toReceive)}</div>
          <div class="sum-copy">${model.toReceive > 0 ? 'Balance in your favour' : 'Nothing pending'}</div>
        </div>
        <div class="sum sum-red">
          <div class="micro">To give</div>
          <div class="sum-amount">${formatMoney(model.toGive)}</div>
          <div class="sum-copy">${model.toGive > 0 ? 'Balance you owe' : 'Nothing pending'}</div>
        </div>
      </div>

      <div class="net">
        <div class="net-label">NET POSITION</div>
        <div class="net-value ${netTone}">${escapeHtml(netCopy)}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Details</th>
            <th class="amount">${escapeHtml(terms.gaveHeader)}</th>
            <th class="amount">${escapeHtml(terms.receivedHeader)}</th>
            <th class="amount">Balance</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div class="closing">
        <div class="closing-label">CLOSING BALANCE</div>
        <div class="closing-value ${netTone}">${escapeHtml(netCopy)}</div>
      </div>

      <div class="footnote">
        Totals — ${escapeHtml(terms.gaveHeader)} ${formatMoney(model.gave)} · ${escapeHtml(terms.receivedHeader)} ${formatMoney(model.received)}.
        Balances are calculated from the entries recorded in Folio.
      </div>

      <div class="footer">
        <div>Generated ${escapeHtml(formatNumericDate(now))} at ${escapeHtml(now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }))}</div>
        <div>Folio · Personal ledger · Stored on this device</div>
      </div>
    </div>
  </body>
</html>`;
}
