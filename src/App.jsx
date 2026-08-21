import React, { useState, useEffect, useCallback } from "react";
import { Package, ClipboardList, Users, CalendarDays, DollarSign, LayoutDashboard, Wrench, LogOut, Shield, Truck, KeyRound } from "lucide-react";
import { supabase } from "./supabaseClient";
import { COLORS } from "./ui";
import Login from "./Login";
import CustomerPortal from "./CustomerPortal";
import Dashboard from "./components/Dashboard";
import Inventory from "./components/Inventory";
import Orders from "./components/Orders";
import Customers from "./components/Customers";
import Staff from "./components/Staff";
import Finances from "./components/Finances";
import Team from "./components/Team";
import Suppliers from "./components/Suppliers";
import CustomerAccess from "./components/CustomerAccess";

const ALL_NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["owner", "manager", "warehouse", "sales"] },
  { id: "inventory", label: "Inventory", icon: Package, roles: ["owner", "manager", "warehouse", "sales"] },
  { id: "orders", label: "Orders", icon: ClipboardList, roles: ["owner", "manager", "warehouse", "sales"] },
  { id: "customers", label: "Customers", icon: Users, roles: ["owner", "manager", "sales"] },
  { id: "staff", label: "Staff Schedule", icon: CalendarDays, roles: ["owner", "manager"] },
  { id: "finances", label: "Finances", icon: DollarSign, roles: ["owner", "manager"] },
  { id: "suppliers", label: "Suppliers", icon: Truck, roles: ["owner", "manager"] },
  { id: "team", label: "Team", icon: Shield, roles: ["owner"] },
  { id: "customer-access", label: "Customer Access", icon: KeyRound, roles: ["owner"] },
];

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [tab, setTab] = useState("dashboard");

  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [finances, setFinances] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [customerProfiles, setCustomerProfiles] = useState([]);
  const [myCustomerProfile, setMyCustomerProfile] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const role = myProfile?.role || "sales"; // safest default while loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async (userId) => {
    const [inv, cust, ord, stf, fin, sup, supInv, prof, custProf] = await Promise.all([
      supabase.from("inventory").select("*").order("part_no").then((r) => r).catch(() => ({ data: [] })),
      supabase.from("customers").select("*").order("name"),
      supabase.from("orders").select("*").order("order_date", { ascending: false }),
      supabase.from("staff_schedule").select("*").order("staff_name").then((r) => r).catch(() => ({ data: [] })),
      supabase.from("finances").select("*").order("entry_date", { ascending: false }).then((r) => r).catch(() => ({ data: [] })),
      supabase.from("suppliers").select("*").order("name").then((r) => r).catch(() => ({ data: [] })),
      supabase.from("supplier_invoices").select("*").order("invoice_date", { ascending: false }).then((r) => r).catch(() => ({ data: [] })),
      supabase.from("profiles").select("*").order("email").then((r) => r).catch(() => ({ data: [] })),
      supabase.from("customer_profiles").select("*").then((r) => r).catch(() => ({ data: [] })),
    ]);
    setInventory(inv.data || []);
    setCustomers(cust.data || []);
    setOrders(ord.data || []);
    setStaff(stf.data || []);
    setFinances(fin.data || []);
    setSuppliers(sup.data || []);
    setSupplierInvoices(supInv.data || []);
    setProfiles(prof.data || []);
    setCustomerProfiles(custProf.data || []);
    const uid = userId || session?.user?.id;
    setMyProfile((prof.data || []).find((p) => p.id === uid) || null);
    setMyCustomerProfile((custProf.data || []).find((p) => p.id === uid) || null);
    setLoadingData(false);
  }, [session]);

  useEffect(() => {
    if (session) refresh(session.user.id);
  }, [session, refresh]);

  useEffect(() => {
    const allowed = ALL_NAV.find((n) => n.id === tab)?.roles.includes(role);
    if (myProfile && !allowed) setTab("dashboard");
  }, [role, tab, myProfile]);

  if (session === undefined) {
    return <Centered>Loading…</Centered>;
  }
  if (!session) {
    return <Login />;
  }
  if (loadingData) {
    return <Centered>Loading shop data…</Centered>;
  }

  // Branch by account type: check for a customer link FIRST — every new login
  // automatically gets a default "sales" staff profile too (see roles migration),
  // so a linked customer account must always win over that accidental staff record.
  if (myCustomerProfile) {
    return <CustomerPortal session={session} />;
  }
  if (!myProfile) {
    return (
      <Centered>
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 10 }}>This login isn't set up yet.</div>
          <div style={{ fontSize: 12.5, color: COLORS.textMuted, marginBottom: 16 }}>Ask the shop owner to link your account.</div>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 4, padding: "6px 14px", fontSize: 12.5, cursor: "pointer" }}
          >
            Sign Out
          </button>
        </div>
      </Centered>
    );
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "Inter, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.panel }} className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 6, background: COLORS.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wrench size={18} color="#1a1300" />
          </div>
          <div>
            <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 19, fontWeight: 600, color: COLORS.text, letterSpacing: "0.03em", textTransform: "uppercase", lineHeight: 1 }}>
              PSM Auto Part
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Wholesale Auto Parts — Internal Ops</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="app-header-right">
          <div style={{ fontSize: 12.5, color: COLORS.textMuted }}>
            {session.user.email}
            <span style={{ marginLeft: 8, color: COLORS.amber, fontWeight: 600, textTransform: "uppercase", fontSize: 11 }}>{role}</span>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 4, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }} className="app-layout">
        <div style={{ width: 190, borderRight: `1px solid ${COLORS.border}`, background: COLORS.panel, padding: "14px 10px", flexShrink: 0 }} className="app-sidebar">
          {ALL_NAV.filter((n) => n.roles.includes(role)).map((n) => {
            const active = tab === n.id;
            const Icon = n.icon;
            const lowStockCount = inventory.filter((i) => i.qty <= i.reorder_point).length;
            return (
              <div
                key={n.id}
                className="nav-item"
                onClick={() => setTab(n.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 4, cursor: "pointer", marginBottom: 3,
                  color: active ? COLORS.amber : COLORS.textMuted, background: active ? "#2a2210" : "transparent",
                  fontSize: 13, fontWeight: active ? 600 : 500, borderLeft: active ? `3px solid ${COLORS.amber}` : "3px solid transparent",
                }}
              >
                <Icon size={15} />
                {n.label}
                {n.id === "inventory" && lowStockCount > 0 && (
                  <span style={{ marginLeft: "auto", background: COLORS.red, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px" }}>
                    {lowStockCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, padding: 24, minWidth: 0, overflowX: "auto" }} className="app-content">
          {tab === "dashboard" && <Dashboard inventory={inventory} customers={customers} orders={orders} finances={role === "owner" || role === "manager" ? finances : []} supplierInvoices={role === "owner" || role === "manager" ? supplierInvoices : []} goTo={setTab} />}
          {tab === "inventory" && <Inventory inventory={inventory} refresh={() => refresh()} role={role} />}
          {tab === "orders" && <Orders orders={orders} customers={customers} inventory={inventory} refresh={() => refresh()} role={role} myEmail={session.user.email} myName={myProfile?.full_name} />}
          {tab === "customers" && <Customers customers={customers} orders={orders} refresh={() => refresh()} role={role} />}
          {tab === "staff" && <Staff staff={staff} refresh={() => refresh()} role={role} />}
          {tab === "finances" && <Finances finances={finances} customers={customers} refresh={() => refresh()} myEmail={session.user.email} myName={myProfile?.full_name} />}
          {tab === "team" && <Team profiles={profiles} refresh={() => refresh()} myId={session.user.id} />}
          {tab === "suppliers" && <Suppliers suppliers={suppliers} supplierInvoices={supplierInvoices} refresh={() => refresh()} />}
          {tab === "customer-access" && <CustomerAccess customerProfiles={customerProfiles} customers={customers} refresh={() => refresh()} />}
        </div>
      </div>
    </div>
  );
}

function Centered({ children }) {
  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, fontFamily: "Inter, sans-serif" }}>
      {children}
    </div>
  );
}
