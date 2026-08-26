"use client";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function fetchQrDataUrls(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const id of ids) {
    try {
      const r = await fetch(`/api/inventory/${id}?qr=1`);
      const j = await r.json();
      out[id] = j.dataUrl;
    } catch { }
  }
  return out;
}

export function openLabelPrintWindow(pages: any[][], cols: number, rows: number) {
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) { alert("Please allow pop-ups to print the label sheet."); return; }

  const dense = cols * rows >= 40;
  const pagesHtml = pages.map(page => `
    <div class="page">
      <header><img src="/logo.png" /><b>Sappy Stationary</b></header>
      <div class="grid ${dense ? "dense" : ""}" style="grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr);">
        ${page.map(cell => cell ? `
          <div class="cell">
            ${cell.qr ? `<img class="qr" src="${cell.qr}" />` : ""}
            <div class="name">${esc(cell.name)}</div>
            <div class="serial">${cell.serial}</div>
          </div>` : `<div class="cell empty"></div>`).join("")}
      </div>
    </div>`).join("");

  w.document.write(`<html><head><title>Sappy Stationary — Labels</title><style>
    @page { size: A4; margin: 8mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; }
    .page { height: 280mm; display: flex; flex-direction: column; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    header { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
    header img { width: 24px; height: 24px; border-radius: 6px; }
    header b { font-size: 13px; color: #065F46; }
    .grid { flex: 1; display: grid; gap: 3px; }
    .cell { border: 1.2px solid #059669; border-radius: 8px; padding: 2px; text-align: center;
            display: flex; flex-direction: column; justify-content: center; align-items: center; overflow: hidden; }
    .cell.empty { border-style: dashed; border-color: #bbb; }
    .qr { width: 58%; max-height: 62%; }
    .name { font-weight: 700; font-size: 9px; line-height: 1.15; }
    .serial { font-size: 7px; color: #555; }
    .dense .qr { width: 72%; }
    .dense .name { font-size: 6.5px; }
    .dense .serial { font-size: 5.5px; }
    .dense .cell { border-radius: 4px; }
  </style></head><body>${pagesHtml}
  <script>window.onload = function(){ window.print(); }<\/script></body></html>`);
  w.document.close();
}