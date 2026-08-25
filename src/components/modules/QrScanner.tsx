"use client";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
export default function QrScanner({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!ref.current) return;
    const q = new Html5Qrcode("qrscan");
    q.start({ facingMode: "environment" }, { fps: 10, qrbox: 220 },
      (text) => { onScan(text); q.stop().catch(()=>{}); },
      () => {}
    ).catch(e => setErr("Camera permission required"));
    return () => { q.stop().catch(()=>{}); };
  }, []);
  return (
    <div className="fixed inset-0 bg-black/80 z-50 grid place-items-center p-4">
      <div className="bg-white rounded-2xl p-4 w-full max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-lg">Scan QR</h3>
          <button onClick={onClose} className="text-emerald-700">✕</button>
        </div>
        <div id="qrscan" ref={ref} className="rounded-xl overflow-hidden bg-black" />
        {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
      </div>
    </div>
  );
}