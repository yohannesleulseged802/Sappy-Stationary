"use client";
import { useEffect, useState } from "react";
import Icon from "../ui/Icon";

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

export default function QrLabel({ item }: { item: any }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    fetch(`/api/inventory/${item.id}?qr=1`).then(r => r.json()).then(j => setSrc(j.dataUrl));
  }, [item.id]);

  function downloadQr() {
    const a = document.createElement("a");
    a.href = src;
    a.download = `${item.serial}.png`;
    a.click();
  }

  async function downloadLabel() {
    if (!src) return;
    const qr = await loadImg(src);
    let logo: HTMLImageElement | null = null;
    try { logo = await loadImg("/logo.png"); } catch { logo = null; }

    const W = 640, H = 900;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d")!;

    x.fillStyle = "#FBF7EE"; x.fillRect(0, 0, W, H);
    x.strokeStyle = "#059669"; x.lineWidth = 10; x.strokeRect(15, 15, W - 30, H - 30);
    x.fillStyle = "#FFFFFF"; x.fillRect(35, 35, W - 70, H - 70);

    let y = 70;
    if (logo) { x.drawImage(logo, (W - 110) / 2, y, 110, 110); y += 130; }
    x.textAlign = "center";
    x.fillStyle = "#065F46"; x.font = "bold 44px Georgia, serif";
    x.fillText("Sappy Stationary", W / 2, y + 30); y += 75;
    x.fillStyle = "#1F2A24"; x.font = "bold 38px Arial";
    const name = item.name.length > 22 ? item.name.slice(0, 21) + "…" : item.name;
    x.fillText(name, W / 2, y + 5); y += 45;
    x.fillStyle = "#6B7280"; x.font = "26px Arial";
    x.fillText(item.serial, W / 2, y + 5); y += 45;

    const qs = 420;
    x.drawImage(qr, (W - qs) / 2, y, qs, qs);

    x.fillStyle = "#9CA3AF"; x.font = "24px Arial";
    x.fillText("sappyshop.site", W / 2, H - 55);

    const a = document.createElement("a");
    a.download = `${item.serial}-label.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  }

  return (
    <div className="text-center">
      <div className="mx-auto w-60 md:w-64 rounded-2xl overflow-hidden border-2 border-emerald-600 bg-white shadow-soft">
        <div className="bg-emerald-600 py-1.5 flex items-center justify-center gap-2">
          <img src="/logo.png" alt="logo" className="w-5 h-5 rounded-md object-cover bg-white" />
          <span className="text-white font-display text-base">Sappy Stationary</span>
        </div>
        <div className="p-3 bg-cream">
          <div className="font-semibold text-sm truncate" title={item.name}>{item.name}</div>
          <div className="text-[11px] text-emerald-900/60 mt-0.5">{item.serial}</div>
          <div className="my-2 bg-white p-2 rounded-xl border border-emerald-100">
            {src ? <img src={src} alt="QR" className="w-full h-auto" /> : <div className="h-32 grid place-items-center text-emerald-900/40 text-xs">Loading…</div>}
          </div>
          <div className="text-[9px] text-emerald-900/50 mt-0.5">sappyshop.site</div>
        </div>
      </div>
      <div className="flex gap-2 justify-center mt-3">
        <button onClick={downloadLabel}
          className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm flex items-center gap-2 hover:bg-emerald-700 transition">
          <Icon name="download" className="w-4 h-4" /> Label PNG
        </button>
        <button onClick={downloadQr}
          className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm flex items-center gap-2 hover:bg-emerald-50 transition">
          <Icon name="qr" className="w-4 h-4" /> QR only
        </button>
      </div>
    </div>
  );
}