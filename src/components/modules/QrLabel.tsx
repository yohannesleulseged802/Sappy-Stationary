"use client";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/money";
export default function QrLabel({ item }: { item: any }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    fetch(`/api/inventory/${item.id}?qr=1`).then(r => r.json()).then(j => setSrc(j.dataUrl));
  }, [item.id]);
  function download() {
    const a = document.createElement("a");
    a.href = src; a.download = `${item.serial}.png`; a.click();
  }
  return (
    <div className="text-center">
      <div className="mx-auto w-64 h-64 bg-white rounded-2xl border-2 border-emerald-600 p-3 flex flex-col">
        <div className="text-center font-display text-lg text-emerald-800">Sappy Stationary</div>
        {src && <img src={src} alt="qr" className="flex-1 object-contain" />}
        <div className="text-center">
          <div className="font-semibold truncate">{item.name}</div>
          <div className="text-xs text-emerald-800/60">{item.serial}</div>
          <div className="font-display text-lg">{fmt(item.price)}</div>
        </div>
      </div>
      <button onClick={download} className="mt-3 rounded-xl bg-emerald-600 text-white px-4 py-2">Download PNG</button>
    </div>
  );
}