import { Asset } from 'expo-asset';

import boldFont from '../../assets/fonts/Roboto_700Bold.ttf';
import regularFont from '../../assets/fonts/Roboto_400Regular.ttf';
import {
  currentCurrency,
  formatMoney,
  formatNumericDate,
  formatNumber,
  formatShortDate,
} from './format';
import { getStatementModel, statementFileName } from './statement';
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
const MARGIN = 40;
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
  creditTerms = false,
): Promise<ShareResult> {
  const terms = ledgerTerms(creditTerms);
  const [{ jsPDF: JsPDF }] = await Promise.all([import('jspdf'), loadFonts()]);
  const fonts = await loadFonts();
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

  // ---- Masthead ------------------------------------------------------------
  pdf.setFillColor(INK);
  pdf.roundedRect(MARGIN, 40, 38, 38, 11, 11, 'F');
  setText(20, '#FFFFFF', 'bold');
  pdf.text('F', MARGIN + 19, 65, { align: 'center' });
  pdf.setFillColor('#8CE0A8');
  pdf.circle(MARGIN + 30, 68, 2.8, 'F');

  setText(17, INK, 'bold');
  pdf.text('Folio', MARGIN + 48, 56);
  setText(7, FAINT);
  pdf.setCharSpace(1.1);
  pdf.text('PERSONAL LEDGER', MARGIN + 48, 68);
  pdf.setCharSpace(0);

  setText(8, MUTED, 'bold');
  pdf.setCharSpace(1.2);
  pdf.text('ACCOUNT STATEMENT', PAGE_W - MARGIN, 48, { align: 'right' });
  pdf.setCharSpace(0);
  setText(9.5, '#3C4553');
  pdf.text(formatNumericDate(model.generatedAt), PAGE_W - MARGIN, 63, { align: 'right' });

  pdf.setDrawColor(LINE);
  pdf.setLineWidth(1);
  pdf.line(MARGIN, 92, PAGE_W - MARGIN, 92);

  // ---- Parties -------------------------------------------------------------
  setText(7, FAINT, 'bold');
  pdf.setCharSpace(1);
  pdf.text('STATEMENT FOR', MARGIN, 116);
  pdf.setCharSpace(0);

  setText(21, INK, 'bold');
  pdf.text(person.name || 'Unnamed account', MARGIN, 140);
  setText(9.5, MUTED);
  pdf.text(person.phone || 'No contact number added', MARGIN, 155);

  setText(7, FAINT, 'bold');
  pdf.setCharSpace(1);
  pdf.text('STATEMENT PERIOD', PAGE_W - MARGIN, 116, { align: 'right' });
  pdf.setCharSpace(0);
  setText(11, INK, 'bold');
  const period =
    model.periodStart && model.periodEnd
      ? model.periodStart === model.periodEnd
        ? formatShortDate(model.periodStart)
        : `${formatShortDate(model.periodStart)} – ${formatShortDate(model.periodEnd)}`
      : 'No entries yet';
  pdf.text(period, PAGE_W - MARGIN, 134, { align: 'right' });
  setText(9.5, MUTED);
  pdf.text(
    `${model.rows.length} ${model.rows.length === 1 ? 'entry' : 'entries'}`,
    PAGE_W - MARGIN,
    149,
    { align: 'right' },
  );

  // ---- Summary -------------------------------------------------------------
  const boxW = (CONTENT_W - 10) / 2;
  const boxY = 176;
  const boxH = 67;

  pdf.setFillColor('#E9F6EF');
  pdf.roundedRect(MARGIN, boxY, boxW, boxH, 12, 12, 'F');
  setText(7, '#4F7A65', 'bold');
  pdf.setCharSpace(1.1);
  pdf.text('TO RECEIVE', MARGIN + 15, boxY + 20);
  pdf.setCharSpace(0);
  setText(18, GREEN, 'bold');
  pdf.text(money(model.toReceive), MARGIN + 15, boxY + 44);
  setText(7.5, '#5F8573');
  pdf.text(model.toReceive > 0 ? 'Balance in your favour' : 'Nothing pending', MARGIN + 15, boxY + 57);

  pdf.setFillColor('#FCEBEA');
  pdf.roundedRect(MARGIN + boxW + 10, boxY, boxW, boxH, 12, 12, 'F');
  setText(7, '#8A5A57', 'bold');
  pdf.setCharSpace(1.1);
  pdf.text('TO GIVE', MARGIN + boxW + 25, boxY + 20);
  pdf.setCharSpace(0);
  setText(18, RED, 'bold');
  pdf.text(money(model.toGive), MARGIN + boxW + 25, boxY + 44);
  setText(7.5, '#8F6562');
  pdf.text(model.toGive > 0 ? 'Balance you owe' : 'Nothing pending', MARGIN + boxW + 25, boxY + 57);

  // ---- Net strip -----------------------------------------------------------
  const netY = boxY + boxH + 12;
  pdf.setFillColor(INK);
  pdf.roundedRect(MARGIN, netY, CONTENT_W, 33, 9, 9, 'F');
  setText(7, '#B9C0CC', 'bold');
  pdf.setCharSpace(1.2);
  pdf.text('NET POSITION', MARGIN + 15, netY + 20);
  pdf.setCharSpace(0);
  setText(9.5, model.balance >= 0 ? '#8CE0A8' : '#FFB4AE', 'bold');
  pdf.text(netCopy, PAGE_W - MARGIN - 15, netY + 20, { align: 'right' });

  // ---- Table ---------------------------------------------------------------
  const colDate = MARGIN;
  const colDetails = MARGIN + 68;
  const colGave = PAGE_W - MARGIN - 168;
  const colReceived = PAGE_W - MARGIN - 86;
  const colBalance = PAGE_W - MARGIN;

  const drawTableHeader = (top: number) => {
    setText(6.8, MUTED, 'bold');
    pdf.setCharSpace(0.7);
    pdf.text('DATE', colDate, top);
    pdf.text('DETAILS', colDetails, top);
    pdf.text(terms.gaveHeader.toUpperCase(), colGave, top, { align: 'right' });
    pdf.text(terms.receivedHeader.toUpperCase(), colReceived, top, { align: 'right' });
    pdf.text('BALANCE', colBalance, top, { align: 'right' });
    pdf.setCharSpace(0);
    pdf.setDrawColor('#D7DEE8');
    pdf.line(MARGIN, top + 7, PAGE_W - MARGIN, top + 7);
  };

  let y = netY + 33 + 42;
  drawTableHeader(y - 17);
  let rowTop = y;

  const rows = [...model.rows].reverse();
  if (rows.length === 0) {
    setText(9, FAINT);
    pdf.text('No entries recorded yet.', PAGE_W / 2, rowTop + 25, { align: 'center' });
    rowTop += 52;
  }

  for (const row of rows) {
    const rowHeight = 31;
    const capacity = PAGE_H - 120;
    if (rowTop + rowHeight > capacity) {
      pdf.addPage();
      setText(8, FAINT, 'bold');
      pdf.text('FOLIO · STATEMENT CONTINUED', MARGIN, 46);
      pdf.setDrawColor(LINE);
      pdf.line(MARGIN, 54, PAGE_W - MARGIN, 54);
      drawTableHeader(76);
      rowTop = 90;
    }

    setText(8.5, MUTED);
    pdf.text(formatShortDate(row.date).replace(/ \d{4}$/, ''), colDate, rowTop + 13);

    setText(9.5, row.type === 'gave' ? RED : GREEN, 'bold');
    pdf.text(row.type === 'gave' ? terms.gave : terms.received, colDetails, rowTop + 12);

    const details = [row.note, row.method].filter(Boolean).join(' · ');
    if (details) {
      setText(7.5, MUTED);
      pdf.text(details.length > 50 ? `${details.slice(0, 50)}…` : details, colDetails, rowTop + 23);
    }

    if (row.type === 'gave') {
      setText(9, RED);
      pdf.text(money(row.amount), colGave, rowTop + 13, { align: 'right' });
    } else {
      setText(9, GREEN);
      pdf.text(money(row.amount), colReceived, rowTop + 13, { align: 'right' });
    }

    setText(9, INK, 'bold');
    pdf.text(`${row.balance < 0 ? '−' : ''}${money(row.balance)}`, colBalance, rowTop + 13, {
      align: 'right',
    });

    pdf.setDrawColor('#EEF1F5');
    pdf.line(MARGIN, rowTop + rowHeight, PAGE_W - MARGIN, rowTop + rowHeight);
    rowTop += rowHeight;
  }

  // ---- Closing -------------------------------------------------------------
  if (rowTop + 88 > PAGE_H - 60) {
    pdf.addPage();
    rowTop = 60;
  }
  const closingY = rowTop + 14;
  pdf.setFillColor('#F5F7FA');
  pdf.roundedRect(MARGIN, closingY, CONTENT_W, 38, 10, 10, 'F');
  setText(7.5, MUTED, 'bold');
  pdf.setCharSpace(1);
  pdf.text('CLOSING BALANCE', MARGIN + 15, closingY + 23);
  pdf.setCharSpace(0);
  setText(13, netColor, 'bold');
  pdf.text(netCopy, PAGE_W - MARGIN - 15, closingY + 24, { align: 'right' });

  setText(7.5, FAINT);
  pdf.text(
    `Total — ${terms.gaveHeader} ${money(model.gave)}  ·  ${terms.receivedHeader} ${money(model.received)}.  Balances reflect all entries in this statement.`,
    MARGIN,
    closingY + 56,
  );

  // ---- Page footers --------------------------------------------------------
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(LINE);
    pdf.line(MARGIN, PAGE_H - 46, PAGE_W - MARGIN, PAGE_H - 46);
    setText(6.8, FAINT);
    pdf.text(
      `Folio · Personal ledger · Generated ${formatNumericDate(model.generatedAt)}`,
      MARGIN,
      PAGE_H - 31,
    );
    pdf.text(`Page ${page} of ${pages}`, PAGE_W - MARGIN, PAGE_H - 31, { align: 'right' });
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
