import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const backendUrl = process.env.REACT_APP_BACKEND_URL;

export function SuperAdminDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/dashboard/super-admin`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  const handleVerify = async (userId) => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/super-admin/users/${userId}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setData((prev) => ({
        ...prev,
        pending_users: prev.pending_users.filter((u) => u.id !== userId),
        total_users: prev.total_users,
        last_verified: res.data,
      }));
    } catch (e) {
      // For MVP, silent fail is acceptable; could integrate toast later
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  if (loading || !data) {
    return (
      <div
        className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-slate-950 text-slate-100"
        data-testid="super-admin-dashboard-loading"
      >
        Loading super admin dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-6xl space-y-6" data-testid="super-admin-dashboard">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Super Admin control panel</h1>
          <div className="text-xs text-slate-400" data-testid="super-admin-total-users">
            Total users in system: <span className="font-semibold text-slate-100">{data.total_users}</span>
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-900/80" data-testid="super-admin-pending-users-card">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">Pending user requests</CardTitle>
          </CardHeader>
          <CardContent>
            {data.pending_users.length === 0 ? (
              <p className="text-sm text-slate-400" data-testid="super-admin-no-pending-users">
                No pending user registrations right now.
              </p>
            ) : (
              <ul className="space-y-3" data-testid="super-admin-pending-users-list">
                {data.pending_users.map((user) => (
                  <li
                    key={user.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm"
                    data-testid="super-admin-pending-user-item"
                  >
                    <div className="space-y-0.5">
                      <div className="font-medium text-slate-100" data-testid="super-admin-pending-user-name">
                        {user.full_name}
                      </div>
                      <div className="text-xs text-slate-400" data-testid="super-admin-pending-user-email">
                        {user.email}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-full bg-emerald-600 px-4 text-xs font-medium text-white hover:bg-emerald-700"
                      onClick={() => handleVerify(user.id)}
                      data-testid="super-admin-verify-user-button"
                    >
                      Verify
                    </Button>
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
