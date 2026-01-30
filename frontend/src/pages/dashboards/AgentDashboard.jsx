import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

const backendUrl = process.env.REACT_APP_BACKEND_URL;

export function AgentDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(`${backendUrl}/api/dashboard/agent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    };
    if (token) fetchData();
  }, [token]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100" data-testid="agent-dashboard-loading">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-5xl space-y-6" data-testid="agent-dashboard">
        <h1 className="text-2xl font-semibold">Agent overview</h1>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-800 bg-slate-900/80" data-testid="agent-total-leads">
            <CardHeader>
              <CardTitle className="text-sm text-slate-300">Total leads</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-white">{data.total_leads}</CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/80" data-testid="agent-completed-bookings">
            <CardHeader>
              <CardTitle className="text-sm text-slate-300">Completed bookings</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-emerald-400">{data.completed_bookings}</CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/80" data-testid="agent-properties-count">
            <CardHeader>
              <CardTitle className="text-sm text-slate-300">Assigned properties</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-white">{data.properties_count}</CardContent>
          </Card>
        </div>
        <Card className="border-slate-800 bg-slate-900/80" data-testid="agent-leads-card">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">Recent leads</CardTitle>
          </CardHeader>
          <CardContent>
            {data.leads.length === 0 ? (
              <p className="text-sm text-slate-400" data-testid="agent-no-leads-message">
                No leads assigned yet.
              </p>
            ) : (
              <ul className="space-y-2" data-testid="agent-leads-list">
                {data.leads.map((lead) => (
                  <li
                    key={lead.id}
                    className="flex items-center justify-between text-sm text-slate-200"
                    data-testid="agent-lead-item"
                  >
                    <span className="capitalize">{lead.type.replace("_", " ")}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-400">{lead.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
