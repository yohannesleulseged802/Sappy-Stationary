"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Html5Qrcode } from "html5-qrcode";
import Icon from "@/components/ui/Icon";

export default function QrScanner({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const [err, setErr] = useState("");
  const [starting, setStarting] = useState(true);
  const [mounted, setMounted] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const stoppedRef = useRef(false);
  const scannedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    stoppedRef.current = false;
    scannedRef.current = false;

    const scanner = new Html5Qrcode("sappy-qr-scan");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
        (decoded) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          onScan(decoded);
        },
        () => {} // ignore decode errors (they fire every frame when no QR is in view)
      )
      .then(() => {
        if (!stoppedRef.current) setStarting(false);
      })
      .catch((e) => {
        console.warn("QR start failed:", e);
        setStarting(false);
        setErr(
          /Permission/i.test(String(e))
            ? "Camera permission denied — please allow camera access in your browser settings and try again."
            : "Camera not available on this device."
        );
      });

    return () => {
      stoppedRef.current = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (!s) return;
      // Always swallow errors — stop() throws if the scanner never started or already stopped
      try {
        const state = (s as any).isScanning;
        if (state) {
          s.stop().then(() => s.clear()).catch(() => {});
        } else {
          try { s.clear(); } catch {}
        }
      } catch {}
    };
  }, [mounted, onScan]);

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
        <div id="sappy-qr-scan" className="rounded-xl overflow-hidden bg-black aspect-square" />
        {starting && !err && (
          <p className="text-sm text-emerald-900/60 mt-2 text-center">Starting camera…</p>
        )}
        {err && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{err}</p>
            <button onClick={onClose} className="mt-2 w-full rounded-xl bg-red-500 text-white py-2 text-sm font-semibold hover:bg-red-600 transition">
              Close
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}