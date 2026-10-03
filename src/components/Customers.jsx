import React, { useState } from "react";
import { Users, Plus, Trash2, Pencil, X, Check, FileClock } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, Card, SectionHeader, Th, Td, Btn, Input, Select, Field, money } from "../ui";
import Statement from "./Statement";

const empty = { id: null, name: "", contact: "", phone: "", type: "Wholesale", address: "", credit_limit: "", notes: "" };

function lastMonthKey() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}

export default function Customers({ customers, orders, refresh, role }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const canDelete = role === "owner" || role === "manager";

  const [statementCustomer, setStatementCustomer] = useState(null);
  const [statementMonth, setStatementMonth] = useState(lastMonthKey());
  const [statementOrders, setStatementOrders] = useState([]);
  const [statementLoading, setStatementLoading] = useState(false);

  function balanceFor(customerId) {
    return orders
      .filter((o) => o.customer_id === customerId && o.status !== "Paid")
      .reduce((sum, o) => sum + Number(o.total), 0);
  }

  function startNew() { setForm(empty); setEditing("new"); }
  function startEdit(c) { setForm(c); setEditing(c.id); }
  function cancel() { setEditing(null); setForm(empty); }

  async function save() {
    if (!form.name.trim()) return;
    const row = { name: form.name, contact: form.contact, phone: form.phone, type: form.type, address: form.address, credit_limit: Number(form.credit_limit) || 0, notes: form.notes };
    if (editing === "new") await supabase.from("customers").insert(row);
    else await supabase.from("customers").update(row).eq("id", form.id);
    cancel();
    refresh();
  }
  async function remove(id) { await supabase.from("customers").delete().eq("id", id); refresh(); }

  const monthOptions = (() => {
    const opts = [];
    const d = new Date();
    for (let i = 0; i < 12; i++) {
      opts.push(d.toISOString().slice(0, 7));
      d.setMonth(d.getMonth() - 1);
    }
    return opts;
  })();

  async function loadStatement(customer, monthStr) {
    setStatementCustomer(customer);
    setStatementMonth(monthStr);
    setStatementLoading(true);
    const monthOrders = orders.filter((o) => o.customer_id === customer.id && o.order_date.slice(0, 7) === monthStr);
    if (monthOrders.length === 0) {
      setStatementOrders([]);
      setStatementLoading(false);
      return;
    }
    const { data: items } = await supabase.from("order_items").select("*").in("order_id", monthOrders.map((o) => o.id));
    const withItems = monthOrders
      .map((o) => ({ ...o, items: (items || []).filter((i) => i.order_id === o.id) }))
      .sort((a, b) => a.order_date.localeCompare(b.order_date));
    setStatementOrders(withItems);
    setStatementLoading(false);
  }

  function changeStatementMonth(monthStr) {
    if (statementCustomer) loadStatement(statementCustomer, monthStr);
  }

  return (
    <div>
      <SectionHeader icon={Users} title="Customers" subtitle={`${customers.length} on file`} right={<Btn kind="primary" onClick={startNew}><Plus size={14} /> Add Customer</Btn>} />

      {editing && (
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} className="form-grid-4">
            <Field label="Business Name" wide><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Contact"><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option>Wholesale</option><option>Retail</option>
              </Select>
            </Field>
            <Field label="Address" wide><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label="Credit Limit ($)"><Input type="number" step="0.01" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} placeholder="0" /></Field>
            <Field label="Notes" wide><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn kind="primary" onClick={save}><Check size={14} /> Save</Btn>
            <Btn kind="ghost" onClick={cancel}><X size={14} /> Cancel</Btn>
          </div>
        </Card>
      )}

      <Card style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><Th>Name</Th><Th>Contact</Th><Th>Phone</Th><Th>Type</Th><Th>Address</Th><Th>Balance Due</Th><Th>Credit Limit</Th><Th>Notes</Th><Th></Th></tr></thead>
          <tbody>
            {customers.map((c) => {
              const balance = balanceFor(c.id);
              const overLimit = c.credit_limit > 0 && balance > c.credit_limit;
              return (
              <tr key={c.id} style={{ background: overLimit ? "#2a1414" : "transparent" }}>
                <Td>{c.name}</Td><Td>{c.contact}</Td><Td mono>{c.phone}</Td>
                <Td><span style={{ color: c.type === "Wholesale" ? COLORS.amber : COLORS.textMuted, fontWeight: 600, fontSize: 12 }}>{c.type}</span></Td>
                <Td style={{ color: COLORS.textMuted }}>{c.address}</Td>
                <Td mono style={{ color: overLimit ? COLORS.red : COLORS.text, fontWeight: overLimit ? 700 : 500 }}>{money(balance)}</Td>
                <Td mono style={{ color: COLORS.textMuted }}>{c.credit_limit > 0 ? money(c.credit_limit) : "—"}</Td>
                <Td style={{ color: COLORS.textMuted }}>{c.notes}</Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn small kind="ghost" onClick={() => startEdit(c)}><Pencil size={12} /></Btn>
                    <Btn small kind="ghost" onClick={() => loadStatement(c, lastMonthKey())}><FileClock size={12} /> Statement</Btn>
                    {canDelete && <Btn small kind="danger" onClick={() => remove(c.id)}><Trash2 size={12} /></Btn>}
                  </div>
                </Td>
              </tr>
              );
            })}
            {customers.length === 0 && <tr><Td style={{ color: COLORS.textMuted }}>No customers yet.</Td></tr>}
          </tbody>
        </table>
      </Card>

      {statementCustomer && (
        <Statement
          customer={statementCustomer}
          month={statementMonth}
          onMonthChange={changeStatementMonth}
          monthOptions={monthOptions}
          ordersWithItems={statementOrders}
          balanceDue={balanceFor(statementCustomer.id)}
          loading={statementLoading}
          onClose={() => setStatementCustomer(null)}
        />
      )}
    </div>
  );
}
