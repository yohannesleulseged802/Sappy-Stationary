import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/70 backdrop-blur rounded-2xl shadow-soft p-8 text-center">
        <Logo className="w-16 h-16 mx-auto" rounded="rounded-2xl" />
        <h1 className="font-display text-3xl mt-4">Sappy Stationary</h1>
        <p className="text-sm text-emerald-900/60">Stationary & Printing workspace</p>
        <div className="mt-6 flex gap-3">
          <Link href="/login" className="flex-1 rounded-xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700 transition">Sign in</Link>
          <Link href="/signup" className="flex-1 rounded-xl border border-emerald-600 text-emerald-700 py-3 font-semibold hover:bg-emerald-50 transition">Create account</Link>
        </div>
      </div>
    </div>
  );
}