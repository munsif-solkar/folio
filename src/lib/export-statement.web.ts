import { Asset } from 'expo-asset';

import boldFont from '../../assets/fonts/Roboto_700Bold.ttf';
import regularFont from '../../assets/fonts/Roboto_400Regular.ttf';
import {
  currentCurrency,
  formatMoney,
  formatNumericDate,
  formatNumber,
  formatShortDate,
  toDateKey,
} from './format';
import { getStatementModel, statementFileName, StatementOptions } from './statement';
import { ledgerTerms } from './terms';
import { Entry, Person } from './types';

export type ShareResult = 'shared' | 'downloaded' | 'printed';

const INK = '#14181F';
const MUTED = '#6B7686';
const FAINT = '#98A1AF';
const LINE = '#E6EAF0';
const GREEN = '#0A7A4B';
const RED = '#C42B2B';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 42;
const CONTENT_W = PAGE_W - MARGIN * 2;

let fontCache: Promise<{ regular: string; bold: string } | null> | null = null;

async function assetToBase64(moduleId: number) {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  const response = await fetch(uri);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function loadFonts() {
  if (!fontCache) {
    fontCache = Promise.all([assetToBase64(regularFont), assetToBase64(boldFont)])
      .then(([regular, bold]) => ({ regular, bold }))
      .catch(() => null);
  }
  return fontCache;
}

export async function shareStatement(
  person: Person,
  entries: Entry[],
  options: StatementOptions = {},
): Promise<ShareResult> {
  const { creditTerms = false, statementName = '' } = options;
  const sender = statementName.trim();
  const terms = ledgerTerms(creditTerms);
  const [{ jsPDF: JsPDF }, fonts] = await Promise.all([import('jspdf'), loadFonts()]);
  const pdf = new JsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
  const hasFonts = Boolean(fonts);

  if (fonts) {
    pdf.addFileToVFS('Roboto-Regular.ttf', fonts.regular);
    pdf.addFont('Roboto-Regular.ttf', 'Folio Sans', 'normal');
    pdf.addFileToVFS('Roboto-Bold.ttf', fonts.bold);
    pdf.addFont('Roboto-Bold.ttf', 'Folio Sans', 'bold');
  }

  const font = hasFonts ? 'Folio Sans' : 'helvetica';
  const model = getStatementModel(person, entries);
  const money = (value: number) =>
    hasFonts ? formatMoney(value) : `${currentCurrency().code} ${formatNumber(value)}`;

  const setText = (size: number, color: string, weight: 'normal' | 'bold' = 'normal') => {
    pdf.setFont(font, weight);
    pdf.setFontSize(size);
    pdf.setTextColor(color);
  };

  const netCopy =
    Math.abs(model.balance) < 0.01
      ? 'All settled up'
      : `${model.balance > 0 ? "You'll receive" : "You'll give"} ${money(model.balance)}`;
  const netColor = Math.abs(model.balance) < 0.01 ? MUTED : model.balance > 0 ? GREEN : RED;
  const accountSince = formatShortDate(toDateKey(new Date(model.accountSince)));
  const period =
    model.periodStart && model.periodEnd
      ? model.periodStart === model.periodEnd
        ? formatShortDate(model.periodStart)
        : `${formatShortDate(model.periodStart)} – ${formatShortDate(model.periodEnd)}`
      : 'No entries yet';

  // ---- Masthead ------------------------------------------------------------
  pdf.setFillColor(INK);
  pdf.roundedRect(MARGIN, 40, 38, 38, 11, 11, 'F');
  setText(20, '#FFFFFF', 'bold');
  pdf.text('F', MARGIN + 19, 65, { align: 'center' });
  pdf.setFillColor('#8CE0A8');
  pdf.circle(MARGIN + 30, 68, 2.8, 'F');

  setText(18, INK, 'bold');
  pdf.text('Folio', MARGIN + 48, 58);
  setText(9, FAINT);
  pdf.setCharSpace(1.2);
  pdf.text('PERSONAL LEDGER', MARGIN + 48, 71);
  pdf.setCharSpace(0);

  setText(9, MUTED, 'bold');
  pdf.setCharSpace(1.2);
  pdf.text('ACCOUNT STATEMENT', PAGE_W - MARGIN, 51, { align: 'right' });
  pdf.setCharSpace(0);
  setText(10.5, '#3C4553');
  pdf.text(formatNumericDate(model.generatedAt), PAGE_W - MARGIN, 67, { align: 'right' });

  pdf.setDrawColor('#B9C2D0');
  pdf.setLineWidth(0.8);
  pdf.line(MARGIN, 94, PAGE_W - MARGIN, 94);

  // ---- Parties -------------------------------------------------------------
  setText(9, FAINT, 'bold');
  pdf.setCharSpace(1);
  pdf.text('STATEMENT FOR', MARGIN, 116);
  pdf.setCharSpace(0);

  setText(20, INK, 'bold');
  pdf.text(person.name || 'Unnamed account', MARGIN, 141);
  setText(10.5, MUTED);
  pdf.text(person.phone || 'No contact number added', MARGIN, 157);
  pdf.text(`Account since ${accountSince}`, MARGIN, 171);
  if (sender) {
    setText(10.5, INK, 'bold');
    pdf.text(`From ${sender}`, MARGIN, 185);
  }

  setText(9, FAINT, 'bold');
  pdf.setCharSpace(1);
  pdf.text('STATEMENT PERIOD', PAGE_W - MARGIN, 116, { align: 'right' });
  pdf.setCharSpace(0);
  setText(13, INK, 'bold');
  pdf.text(period, PAGE_W - MARGIN, 140, { align: 'right' });
  setText(10.5, MUTED);
  pdf.text(
    `${model.rows.length} ${model.rows.length === 1 ? 'entry' : 'entries'}`,
    PAGE_W - MARGIN,
    157,
    { align: 'right' },
  );

  // ---- Summary -------------------------------------------------------------
  const boxW = (CONTENT_W - 14) / 2;
  const boxY = 202;
  const boxH = 66;
  const rightX = MARGIN + boxW + 14;

  pdf.setDrawColor(LINE);
  pdf.roundedRect(MARGIN, boxY, boxW, boxH, 10, 10, 'S');
  pdf.roundedRect(rightX, boxY, boxW, boxH, 10, 10, 'S');

  setText(9, MUTED, 'bold');
  pdf.setCharSpace(0.8);
  pdf.text('TO RECEIVE', MARGIN + 15, boxY + 20);
  pdf.text('TO GIVE', rightX + 15, boxY + 20);
  pdf.setCharSpace(0);

  setText(20, GREEN, 'bold');
  pdf.text(money(model.toReceive), MARGIN + 15, boxY + 45);
  setText(20, RED, 'bold');
  pdf.text(money(model.toGive), rightX + 15, boxY + 45);

  setText(10.5, MUTED);
  pdf.text(model.toReceive > 0 ? 'Balance in your favour' : 'Nothing pending', MARGIN + 15, boxY + 59);
  pdf.text(model.toGive > 0 ? 'Balance you owe' : 'Nothing pending', rightX + 15, boxY + 59);

  // ---- Net position (plain, no dark strip) ---------------------------------
  const netY = 292;
  setText(9.5, MUTED, 'bold');
  pdf.setCharSpace(1);
  pdf.text('NET POSITION', MARGIN, netY);
  pdf.setCharSpace(0);
  setText(14, netColor, 'bold');
  pdf.text(netCopy, PAGE_W - MARGIN, netY, { align: 'right' });
  pdf.setDrawColor('#B9C2D0');
  pdf.line(MARGIN, netY + 10, PAGE_W - MARGIN, netY + 10);

  // ---- Table ---------------------------------------------------------------
  const colDate = MARGIN;
  const colDetails = MARGIN + 68;
  const colBalance = PAGE_W - MARGIN;
  const colReceived = colBalance - 104;
  const colGave = colReceived - 92;

  const drawTableHeader = (top: number) => {
    setText(8.5, MUTED, 'bold');
    pdf.setCharSpace(0.6);
    pdf.text('DATE', colDate, top);
    pdf.text('DETAILS', colDetails, top);
    pdf.text(terms.gaveHeader.toUpperCase(), colGave, top, { align: 'right' });
    pdf.text(terms.receivedHeader.toUpperCase(), colReceived, top, { align: 'right' });
    pdf.text('BALANCE', colBalance, top, { align: 'right' });
    pdf.setCharSpace(0);
    pdf.setDrawColor('#B9C2D0');
    pdf.line(MARGIN, top + 8, PAGE_W - MARGIN, top + 8);
  };

  let y = 341;
  drawTableHeader(y - 18);
  let rowTop = y;

  const rows = [...model.rows].reverse();
  if (rows.length === 0) {
    setText(11, FAINT);
    pdf.text('No entries recorded yet.', PAGE_W / 2, rowTop + 24, { align: 'center' });
    rowTop += 50;
  }

  for (const row of rows) {
    const details = [row.note, row.method].filter(Boolean).join(' · ');
    setText(9.5, MUTED);
    const detailLines = details ? pdf.splitTextToSize(details, colGave - colDetails - 12) : [];
    const rowHeight = Math.max(35, 23 + detailLines.length * 13);

    if (rowTop + rowHeight > PAGE_H - 100) {
      pdf.addPage();
      setText(8.5, FAINT, 'bold');
      pdf.setCharSpace(0.8);
      pdf.text('FOLIO · STATEMENT CONTINUED', MARGIN, 46);
      pdf.setCharSpace(0);
      pdf.setDrawColor(LINE);
      pdf.line(MARGIN, 54, PAGE_W - MARGIN, 54);
      drawTableHeader(76);
      rowTop = 90;
    }

    setText(10.5, MUTED);
    pdf.text(formatShortDate(row.date).replace(/ \d{4}$/, ''), colDate, rowTop + 14);

    setText(11, row.type === 'gave' ? RED : GREEN, 'bold');
    pdf.text(row.type === 'gave' ? terms.gave : terms.received, colDetails, rowTop + 14);

    if (detailLines.length > 0) {
      setText(9.5, MUTED);
      detailLines.forEach((line: string, index: number) => {
        pdf.text(line, colDetails, rowTop + 28 + index * 13);
      });
    }

    if (row.type === 'gave') {
      setText(10.5, RED);
      pdf.text(money(row.amount), colGave, rowTop + 14, { align: 'right' });
    } else {
      setText(10.5, GREEN);
      pdf.text(money(row.amount), colReceived, rowTop + 14, { align: 'right' });
    }

    setText(10.5, INK, 'bold');
    pdf.text(`${row.balance < 0 ? '−' : ''}${money(Math.abs(row.balance))}`, colBalance, rowTop + 14, {
      align: 'right',
    });

    pdf.setDrawColor(LINE);
    pdf.line(MARGIN, rowTop + rowHeight, PAGE_W - MARGIN, rowTop + rowHeight);
    rowTop += rowHeight;
  }

  // ---- Closing -------------------------------------------------------------
  if (rowTop + 100 > PAGE_H - 70) {
    pdf.addPage();
    rowTop = 62;
  }
  const closingY = rowTop + 12;
  pdf.setDrawColor('#B9C2D0');
  pdf.setLineWidth(0.8);
  pdf.line(MARGIN, closingY, PAGE_W - MARGIN, closingY);

  setText(9.5, MUTED, 'bold');
  pdf.setCharSpace(0.8);
  pdf.text('CLOSING BALANCE', MARGIN, closingY + 22);
  pdf.setCharSpace(0);
  setText(16, netColor, 'bold');
  pdf.text(netCopy, PAGE_W - MARGIN, closingY + 23, { align: 'right' });
  pdf.setDrawColor(LINE);
  pdf.line(MARGIN, closingY + 36, PAGE_W - MARGIN, closingY + 36);

  setText(10, MUTED);
  const footnote = `Totals — ${terms.gaveHeader} ${money(model.gave)}  ·  ${
    terms.receivedHeader
  } ${money(model.received)}. Balances reflect all entries in this statement.`;
  pdf.text(pdf.splitTextToSize(footnote, CONTENT_W), MARGIN, closingY + 55);

  // ---- Page footers --------------------------------------------------------
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(LINE);
    pdf.line(MARGIN, PAGE_H - 48, PAGE_W - MARGIN, PAGE_H - 48);
    setText(9, FAINT);
    pdf.text(
      `Folio · Personal ledger · Generated ${formatNumericDate(model.generatedAt)}`,
      MARGIN,
      PAGE_H - 30,
    );
    pdf.text(`Page ${page} of ${pages}`, PAGE_W - MARGIN, PAGE_H - 30, { align: 'right' });
  }

  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = statementFileName(person, model.generatedAt);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  return 'downloaded';
}
