import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";

const backendUrl = process.env.REACT_APP_BACKEND_URL;

export function LandingPage() {
  const [properties, setProperties] = useState([]);
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProps = async () => {
      const res = await axios.get(`${backendUrl}/api/properties`, {
        params: {
          city: city || undefined,
          type: type || undefined,
          max_price: maxPrice || undefined,
        },
      });
      setProperties(res.data);
    };
    fetchProps();
  }, [city, type, maxPrice]);

  const goToDashboard = () => {
    if (!user) return;
    if (user.role === "customer") navigate("/dashboard/customer");
    else if (user.role === "agent") navigate("/dashboard/agent");
    else if (user.role === "franchise_owner") navigate("/dashboard/franchise");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-600" />
            <div>
              <div className="text-lg font-semibold tracking-tight" data-testid="brand-name">
                Golasco Property
              </div>
              <p className="text-xs text-slate-400">Urban real estate network</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <Button
                data-testid="header-dashboard-button"
                variant="outline"
                className="border-emerald-500/40 bg-slate-900/60 text-sm hover:bg-slate-900"
                onClick={goToDashboard}
              >
                Go to Dashboard
              </Button>
            )}
            <Link to="/login" data-testid="header-login-link">
              <Button className="rounded-full bg-emerald-600 px-5 text-sm font-medium text-white hover:bg-emerald-700">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="grid gap-10 md:grid-cols-[1.4fr_minmax(0,1fr)]">
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl" data-testid="hero-heading">
              Find your next home with <span className="text-emerald-400">Golasco</span>.
            </h1>
            <p className="max-w-xl text-base text-slate-300 md:text-lg" data-testid="hero-subtitle">
              A modern network for customers, agents, and franchise owners to manage urban real estate in one fast, 
              PWA-ready dashboard.
            </p>

            <div
              className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm md:grid-cols-4"
              data-testid="property-filters"
            >
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">City</label>
                <Input
                  data-testid="filter-city-input"
                  placeholder="e.g. Mumbai, Pune"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-10 border-slate-700 bg-slate-950/60 text-sm focus-visible:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger
                    data-testid="filter-type-select"
                    className="h-10 border-slate-700 bg-slate-950/60 text-sm focus:ring-emerald-500 focus-visible:ring-emerald-500"
                  >
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1BHK">1BHK</SelectItem>
                    <SelectItem value="2BHK">2BHK</SelectItem>
                    <SelectItem value="3BHK">3BHK</SelectItem>
                    <SelectItem value="Plot">Plot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">Max Price (₹)</label>
                <Input
                  data-testid="filter-max-price-input"
                  type="number"
                  placeholder="50,00,000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-10 border-slate-700 bg-slate-950/60 text-sm focus-visible:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-slate-800 bg-slate-900/70" data-testid="role-highlight-card">
              <CardContent className="space-y-3 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Built for scale</p>
                <h2 className="text-base font-semibold text-white md:text-lg">Customers, Agents & Franchise Owners</h2>
                <p className="text-sm text-slate-300">
                  Login as a customer to book site visits and pay booking amounts online. Agents and franchise owners
                  manage properties, leads, and revenue in real time.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white" data-testid="properties-heading">
              Featured properties
            </h2>
          </div>
          <div
            className="grid gap-4 md:grid-cols-3"
            data-testid="properties-list"
          >
            {properties.map((p) => (
              <Card
                key={p.id}
                className="group flex cursor-pointer flex-col border-slate-800 bg-slate-900/70 hover:border-emerald-500/60"
                data-testid="property-card"
                onClick={() => navigate(`/properties/${p.id}`)}
              >
                <CardContent className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-medium uppercase tracking-wide text-emerald-400">{p.city}</div>
                    <span
                      data-testid="property-status-badge"
                      className="rounded-full bg-slate-800 px-2 py-0.5 text-xs capitalize text-slate-200"
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="mb-1 text-sm font-semibold text-white" data-testid="property-title">
                    {p.title}
                  </div>
                  <div className="mb-2 text-xs text-slate-400" data-testid="property-type">
                    {p.property_type}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="text-sm font-semibold text-emerald-400" data-testid="property-price">
                      ₹ {p.price?.toLocaleString?.("en-IN") ?? p.price}
                    </div>
                    <button
                      type="button"
                      data-testid="property-view-button"
                      className="text-xs font-medium text-emerald-300 underline-offset-2 hover:text-emerald-200 hover:underline"
                    >
                      View details
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {properties.length === 0 && (
              <div
                className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400"
                data-testid="no-properties-message"
              >
                No properties found yet. Franchise owners can add properties from their dashboard.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
