import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const backendUrl = process.env.REACT_APP_BACKEND_URL;

export function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const { toast } = useToast();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProp = async () => {
      const res = await axios.get(`${backendUrl}/api/properties/${id}`);
      setProperty(res.data);
    };
    fetchProp();
  }, [id]);

  const ensureCustomer = () => {
    if (!user) {
      navigate("/login");
      return false;
    }
    if (user.role !== "customer") {
      toast({
        title: "Customer account required",
        description: "Please login with a customer account to continue.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const createLead = async (type) => {
    if (!ensureCustomer()) return;
    try {
      await axios.post(
        `${backendUrl}/api/leads`,
        { property_id: property.id, type },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast({ title: "Request submitted", description: `Your ${type.replace("_", " ")} request is received.` });
    } catch (error) {
      toast({
        title: "Could not submit",
        description: error.response?.data?.detail || "Please try again",
        variant: "destructive",
      });
    }
  };

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleBooking = async () => {
    if (!ensureCustomer()) return;
    if (!property) return;

    const ok = await loadRazorpayScript();
    if (!ok) {
      toast({ title: "Payment SDK failed", description: "Please check your connection and try again." });
      return;
    }

    try {
      const amount = property.price * 0.1; // 10% booking amount for demo
      const res = await axios.post(
        `${backendUrl}/api/leads/booking/create-order`,
        { property_id: property.id, amount },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const { order_id, amount: orderAmount, currency, razorpay_key, lead_id } = res.data;

      const options = {
        key: razorpay_key,
        amount: orderAmount * 100,
        currency,
        name: "Golasco Property",
        description: `Booking for ${property.title}`,
        order_id,
        handler: async (response) => {
          try {
            await axios.post(
              `${backendUrl}/api/leads/booking/verify`,
              {
                lead_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } },
            );
            toast({ title: "Booking confirmed", description: "Your online booking is successful." });
          } catch (error) {
            toast({
              title: "Verification failed",
              description: error.response?.data?.detail || "We will verify your payment manually.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          email: user?.email,
          name: user?.full_name,
        },
        theme: { color: "#059669" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast({
        title: "Could not start booking",
        description: error.response?.data?.detail || "Please try again",
        variant: "destructive",
      });
    }
  };

  if (!property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100" data-testid="property-loading">
        Loading property...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <Card className="border-slate-800 bg-slate-900/80" data-testid="property-detail-card">
          <CardHeader>
            <CardTitle className="flex flex-col gap-1 text-xl text-white md:flex-row md:items-center md:justify-between">
              <span data-testid="property-detail-title">{property.title}</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs capitalize text-slate-200" data-testid="property-detail-status">
                {property.status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span data-testid="property-detail-city">{property.city}</span>
              <span className="text-slate-500">•</span>
              <span data-testid="property-detail-type">{property.property_type}</span>
              <span className="text-slate-500">•</span>
              <span className="font-semibold text-emerald-400" data-testid="property-detail-price">
                ₹ {property.price?.toLocaleString?.("en-IN") ?? property.price}
              </span>
            </div>
            <p className="text-sm text-slate-300" data-testid="property-detail-description">
              {property.description}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                data-testid="button-book-site-visit"
                variant="outline"
                className="border-emerald-500/40 bg-slate-900/60 text-xs font-medium hover:bg-slate-900"
                onClick={() => createLead("site_visit")}
              >
                Book site visit
              </Button>
              <Button
                data-testid="button-apply-loan"
                variant="outline"
                className="border-emerald-500/40 bg-slate-900/60 text-xs font-medium hover:bg-slate-900"
                onClick={() => createLead("loan")}
              >
                Apply for loan
              </Button>
              <Button
                data-testid="button-book-online"
                className="rounded-full bg-emerald-600 px-5 text-xs font-medium text-white hover:bg-emerald-700"
                onClick={handleBooking}
              >
                Book online
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
