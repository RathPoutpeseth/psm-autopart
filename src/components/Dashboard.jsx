import React from "react";
import { LayoutDashboard, Package, AlertTriangle, ClipboardList, Users, TrendingUp, TrendingDown, CreditCard, Truck } from "lucide-react";
import { COLORS, Card, StatCard, SectionHeader, Th, Td, PartTag, Btn, money } from "../ui";

export default function Dashboard({ inventory, customers, orders, finances, supplierInvoices, goTo }) {
  const lowStock = inventory.filter((i) => i.qty <= i.reorder_point);
  const inventoryValue = inventory.reduce((s, i) => s + i.cost * i.qty, 0);

  const monthKey = new Date().toISOString().slice(0, 7);
  const monthFin = finances.filter((f) => f.entry_date.slice(0, 7) === monthKey);
  const monthIncome = monthFin.filter((f) => f.type === "income").reduce((s, f) => s + Number(f.amount), 0);
  const monthExpense = monthFin.filter((f) => f.type === "expense").reduce((s, f) => s + Number(f.amount), 0);
  const net = monthIncome - monthExpense;

  const todayKey = new Date().toISOString().slice(0, 10);
  const todaysOrders = orders.filter((o) => o.order_date === todayKey);

  const balanceFor = (customerId) =>
    orders.filter((o) => o.customer_id === customerId && o.status !== "Paid").reduce((s, o) => s + Number(o.total), 0);
  const overLimit = customers
    .map((c) => ({ ...c, balance: balanceFor(c.id) }))
    .filter((c) => c.credit_limit > 0 && c.balance > c.credit_limit);

  return (
    <div>
      <SectionHeader icon={LayoutDashboard} title="Dashboard" subtitle="Shop status at a glance" />
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
        <StatCard icon={Package} label="Inventory Value" value={money(inventoryValue)} />
        <StatCard icon={AlertTriangle} label="Low Stock Items" value={lowStock.length} tone={lowStock.length ? "danger" : "good"} />
        <StatCard icon={ClipboardList} label="Orders Today" value={todaysOrders.length} />
        <StatCard icon={Users} label="Customers" value={customers.length} />
        {supplierInvoices && supplierInvoices.length > 0 && (
          <StatCard
            icon={Truck}
            label="Owed to Suppliers"
            value={money(supplierInvoices.filter((b) => b.status !== "Paid").reduce((s, b) => s + Number(b.amount), 0))}
            tone="danger"
          />
        )}
        <StatCard icon={net >= 0 ? TrendingUp : TrendingDown} label="Net This Month" value={money(net)} tone={net >= 0 ? "good" : "danger"} />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card style={{ flex: "2 1 380px", padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: "Oswald, sans-serif", textTransform: "uppercase", fontSize: 14, letterSpacing: "0.04em", color: COLORS.text }}>
              Reorder Watchlist
            </div>
            <Btn small kind="ghost" onClick={() => goTo("inventory")}>Manage inventory</Btn>
          </div>
          {lowStock.length === 0 ? (
            <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Nothing below reorder point.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><Th>Part</Th><Th>Name</Th><Th>On Hand</Th><Th>Reorder At</Th></tr></thead>
              <tbody>
                {lowStock.map((i) => (
                  <tr key={i.id}>
                    <Td mono><PartTag>{i.part_no}</PartTag></Td>
                    <Td>{i.name}</Td>
                    <Td mono style={{ color: COLORS.red }}>{i.qty}</Td>
                    <Td mono>{i.reorder_point}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {overLimit.length > 0 && (
          <Card style={{ flex: "2 1 380px", padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontFamily: "Oswald, sans-serif", textTransform: "uppercase", fontSize: 14, letterSpacing: "0.04em", color: COLORS.text, display: "flex", alignItems: "center", gap: 8 }}>
                <CreditCard size={15} color={COLORS.red} /> Over Credit Limit
              </div>
              <Btn small kind="ghost" onClick={() => goTo("customers")}>Manage customers</Btn>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><Th>Customer</Th><Th>Balance Due</Th><Th>Credit Limit</Th></tr></thead>
              <tbody>
                {overLimit.map((c) => (
                  <tr key={c.id}>
                    <Td>{c.name}</Td>
                    <Td mono style={{ color: COLORS.red, fontWeight: 700 }}>{money(c.balance)}</Td>
                    <Td mono>{money(c.credit_limit)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Card style={{ flex: "1 1 260px", padding: 18 }}>
          <div style={{ fontFamily: "Oswald, sans-serif", textTransform: "uppercase", fontSize: 14, letterSpacing: "0.04em", color: COLORS.text, marginBottom: 10 }}>
            This Month
          </div>
          <Row label="Income" value={money(monthIncome)} color={COLORS.green} />
          <Row label="Expenses" value={money(monthExpense)} color={COLORS.red} />
          <div style={{ height: 1, background: COLORS.border, margin: "10px 0" }} />
          <Row label="Net" value={money(net)} color={net >= 0 ? COLORS.green : COLORS.red} bold />
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, color, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13.5 }}>
      <span style={{ color: COLORS.textMuted }}>{label}</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: color || COLORS.text, fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  );
}
