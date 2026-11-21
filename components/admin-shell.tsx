"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowLeft, Boxes, LayoutDashboard, LogOut, Radio, Sparkles, Tags, Zap } from "lucide-react";
import { api } from "@/lib/api";

const navigation = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/retailer", label: "Retailer OS (12 Mods)", icon: Sparkles },
  { href: "/admin/events", label: "Event stream", icon: Radio },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/catalog", label: "Catalog", icon: Tags },
];

export function AdminShell({ children, active, title, description }: { children: React.ReactNode; active: string; title: string; description: string }) {
  const queryClient = useQueryClient();

  async function signOut() {
    await api("/admin/session", { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["admin-session"] });
  }

  return (
    <main className="admin-layout page-width">
      <aside className="admin-sidebar"><Link href="/admin" className="admin-brand"><span className="brand-mark"><Zap size={16} fill="currentColor" /></span><span>RETAILX <small>OPERATIONS</small></span></Link><div className="admin-nav-label">WORKSPACE</div><nav>{navigation.map(({ href, label, icon: Icon }) => <Link className={active === href ? "active" : ""} href={href} key={href}><Icon size={16} />{label}{active === href && <span className="admin-nav-active" />}</Link>)}</nav><div className="admin-sidebar-bottom"><span className="admin-live-indicator"><i /> LIVE ENVIRONMENT</span><Link href="/" className="back-store"><ArrowLeft size={14} /> Back to storefront</Link><span className="admin-platform"><Activity size={13} /> Aiven infrastructure</span><button className="admin-signout" onClick={() => void signOut()}><LogOut size={13} /> Sign out</button></div></aside>
      <section className="admin-content"><div className="admin-page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> RETAIL OPERATIONS</div><h1>{title}</h1><p>{description}</p></div><div className="admin-heading-actions">{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</div></div>{children}</section>
    </main>
  );
}