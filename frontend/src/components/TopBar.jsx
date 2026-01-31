import React from "react";
import { Link } from "react-router-dom";

export function TopBar() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur" data-testid="global-topbar">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          to="/"
          data-testid="global-home-link"
          className="flex items-center gap-2 text-slate-50 hover:text-emerald-300"
        >
          <div className="h-8 w-8 rounded-lg bg-emerald-600" />
          <span className="text-sm font-semibold tracking-tight">Golasco Property</span>
        </Link>
      </div>
    </header>
  );
}
