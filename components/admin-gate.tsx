"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, KeyRound, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";

type Session = { configured: boolean; authenticated: boolean };

export function AdminGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const queryClient = useQueryClient();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const session = useQuery({ queryKey: ["admin-session"], queryFn: () => api<Session>("/admin/session"), retry: false });

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api("/admin/session", { method: "POST", body: JSON.stringify({ key }) });
      await queryClient.invalidateQueries({ queryKey: ["admin-session"] });
      setKey("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  if (session.isLoading) return <main className="admin-gate-loading page-width">Checking admin access…</main>;
  if (session.data?.authenticated) return children;

  if (session.isError) {
    const message = session.error instanceof Error ? session.error.message : "The admin service could not be reached.";
    return <main className="admin-gate page-width"><div className="admin-gate-mark"><LockKeyhole size={21} /></div><div className="eyebrow"><span className="eyebrow-line" /> RETAILX OPERATIONS</div><h1>Authorized people,<br /><em>only.</em></h1><div className="admin-not-configured"><strong>Unable to check admin access.</strong><p>{message} Check the frontend API connection and try again.</p></div></main>;
  }

  return <main className="admin-gate page-width"><div className="admin-gate-mark"><LockKeyhole size={21} /></div><div className="eyebrow"><span className="eyebrow-line" /> RETAILX OPERATIONS</div><h1>Authorized people,<br /><em>only.</em></h1>{session.data?.configured ? <><p>Enter your admin access key to view the retail network.</p><form onSubmit={signIn}><label><KeyRound size={15} /><input type="password" autoComplete="current-password" value={key} onChange={(event) => setKey(event.target.value)} placeholder="Admin access key" required /><button disabled={submitting || !key} aria-label="Sign in"><ArrowRight size={17} /></button></label>{error && <span className="admin-gate-error">{error}</span>}</form></> : <div className="admin-not-configured"><strong>Admin access is not configured.</strong><p>Set ADMIN_ACCESS_KEY and a 32-character ADMIN_SESSION_SECRET in your environment to enable protected operations access.</p></div>}</main>;
}