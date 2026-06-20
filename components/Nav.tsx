"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/logs", label: "Trade Log" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="group flex items-center gap-2">
          <Logo className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
          <span className="text-base font-semibold tracking-tight text-white">
            Au<span className="text-gradient">gur</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
