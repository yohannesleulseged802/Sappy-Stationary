"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Html5Qrcode } from "html5-qrcode";
import Icon from "@/components/ui/Icon";

/* Unique two-note success chime (WebAudio — no audio file needed) */
let audioCtx: AudioContext | null = null;
function playScanBeep() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    const ctx = audioCtx;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    [1046.5, 1568.0].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      const t = now + i * 0.09;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 0.2);
    });
  } catch { }
}

export default function QrScanner({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCam, setActiveCam] = useState("");
  const [starting, setStarting] = useState(true);
  const [err, setErr] = useState("");
  const [scanKey, setScanKey] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    setMounted(true);
    aliveRef.current = true;
    return () => { aliveRef.current = false; stopCurrent(); };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    Html5Qrcode.getCameras()
      .then(cams => {
        if (!aliveRef.current) return;
        const list = (cams || []).map((c, i) => ({ id: c.id, label: c.label || `Camera ${i + 1}` }));
        setCameras(list);
        const back = list.find(c => /back|rear|environment/i.test(c.label)) || list[0];
        start(back?.id);
      })
      .catch(() => {
        if (!aliveRef.current) return;
        setStarting(false);
        setErr("Camera permission denied — allow camera access in browser settings, then reopen the scanner.");
      });
  }, [mounted]);

  function stopCurrent() {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (!s) return;
    try {
      if ((s as any).isScanning) s.stop().then(() => { try { s.clear(); } catch { } }).catch(() => { });
      else { try { s.clear(); } catch { } }
    } catch { }
  }

  async function start(camId?: string) {
    stopCurrent();
    scannedRef.current = false;
    setStarting(true);
    setErr("");
    setScanKey(k => k + 1);
    await new Promise(r => setTimeout(r, 30)); // let the fresh div mount
    if (!aliveRef.current) return;
    const scanner = new Html5Qrcode("sappy-qr-scan");
    scannerRef.current = scanner;
    try {
      await scanner.start(
        camId || { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        decoded => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          playScanBeep(); // 🔔 success sound
          onScan(decoded);
        },
        () => { }
      );
      if (!aliveRef.current) { stopCurrent(); return; }
      setActiveCam(camId || "auto");
      setStarting(false);
    } catch (e) {
      if (!aliveRef.current) return;
      setStarting(false);
      setErr(/Permission/i.test(String(e)) ? "Camera permission denied." : "Could not start this camera — try another one below.");
    }
  }

  function camLabel(label: string, i: number) {
    if (/back|rear|environment/i.test(label)) return "Back camera";
    if (/front|user/i.test(label)) return "Front camera";
    return `Camera ${i + 1}`;
  }

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/85 z-[60] grid place-items-center p-4">
      <div className="bg-white rounded-2xl p-4 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg">Scan QR code</h3>
          <button onClick={onClose} className="text-emerald-700 hover:bg-emerald-50 rounded-lg w-9 h-9 grid place-items-center">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <div key={scanKey} id="sappy-qr-scan" className="rounded-xl overflow-hidden bg-black aspect-square" />

        {starting && !err && <p className="text-sm text-emerald-900/60 mt-2 text-center">Starting camera…</p>}

        {err && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{err}</p>
            <button onClick={onClose} className="mt-2 w-full rounded-xl bg-red-500 text-white py-2 text-sm font-semibold hover:bg-red-600 transition">Close</button>
          </div>
        )}

        {cameras.length > 1 && (
          <div className="mt-3">
            <div className="text-[11px] uppercase tracking-wide text-emerald-900/50 font-semibold mb-1">Choose camera</div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {cameras.map((c, i) => (
                <button key={c.id} onClick={() => start(c.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                    activeCam === c.id ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}>
                  <Icon name="camera" className="w-3.5 h-3.5" />
                  {camLabel(c.label, i)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}