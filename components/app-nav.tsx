"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  Lightbulb,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Ideas", icon: Lightbulb },
  { href: "/pick", label: "Pick", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/ideas");
  return pathname.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg py-1 font-display text-lg font-semibold tracking-tight text-stone-900 transition-colors hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
            <Heart className="h-4 w-4 fill-current" aria-hidden="true" />
          </span>
          <span>Date Planner</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                  active
                    ? "bg-rose-50 text-rose-700"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
          <Link
            href="/ideas/new"
            className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add idea
          </Link>
        </nav>

        <Link
          href="/ideas/new"
          className="inline-flex h-9 items-center gap-1 rounded-full bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 md:hidden"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          New
        </Link>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200/90 bg-white/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 items-center px-2 pt-1.5">
        {navItems.slice(0, 2).map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors ${
                active ? "text-rose-600" : "text-stone-500 hover:text-stone-900"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.25]" : ""}`} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}

        <div className="flex justify-center">
          <Link
            href="/ideas/new"
            aria-label="Add new idea"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-600 text-white shadow-md shadow-rose-600/25 transition-transform active:scale-95 hover:bg-rose-700"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>

        {navItems.slice(2).map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors ${
                active ? "text-rose-600" : "text-stone-500 hover:text-stone-900"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.25]" : ""}`} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
