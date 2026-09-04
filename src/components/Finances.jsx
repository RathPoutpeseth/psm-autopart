import React, { useState } from "react";
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, Receipt as ReceiptIcon } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, Card, StatCard, SectionHeader, Th, Td, Btn, Input, Select, Field, money } from "../ui";
import Receipt from "./Receipt";

const empty = { date: new Date().toISOString().slice(0, 10), type: "income", category: "", amount: "", note: "", customer_id: "" };

export default function Finances({ finances, customers, refresh, myEmail, myName }) {
  const [form, setForm] = useState(empty);
  const [filterType, setFilterType] = useState("all");
  const [receiptEntry, setReceiptEntry] = useState(null);

  async function add() {
    if (!form.amount || isNaN(Number(form.amount))) return;
    await supabase.from("finances").insert({
      entry_date: form.date, type: form.type, category: form.category, amount: Number(form.amount),
      note: form.note, customer_id: form.customer_id || null,
    });
    setForm({ ...empty, date: form.date });
    refresh();
  }
  async function remove(id) { await supabase.from("finances").delete().eq("id", id); refresh(); }

  const totalIncome = finances.filter((f) => f.type === "income").reduce((s, f) => s + Number(f.amount), 0);
  const totalExpense = finances.filter((f) => f.type === "expense").reduce((s, f) => s + Number(f.amount), 0);
  const visible = finances.filter((f) => filterType === "all" || f.type === filterType);
  const customerName = (id) => customers.find((c) => c.id === id)?.name || "";

  return (
    <div>
      <SectionHeader icon={DollarSign} title="Finances" subtitle="Income & expense log" />

      <div style={{ display: "flex", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard icon={TrendingUp} label="Total Income" value={money(totalIncome)} tone="good" />
        <StatCard icon={TrendingDown} label="Total Expenses" value={money(totalExpense)} tone="danger" />
        <StatCard icon={DollarSign} label="Net" value={money(totalIncome - totalExpense)} />
      </div>

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }} className="form-grid-6">
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="income">Income</option><option value="expense">Expense</option>
            </Select>
          </Field>
          <Field label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Sales, Rent, Fuel…" /></Field>
          <Field label="Amount ($)"><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
          {form.type === "income" && (
            <Field label="Customer (optional)">
              <Select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                <option value="">—</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Note"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
        </div>
        <div style={{ marginTop: 12 }}><Btn kind="primary" onClick={add}><Plus size={14} /> Log Entry</Btn></div>
      </Card>

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {["all", "income", "expense"].map((t) => (
          <Btn key={t} small kind={filterType === t ? "primary" : "ghost"} onClick={() => setFilterType(t)}>{t[0].toUpperCase() + t.slice(1)}</Btn>
        ))}
      </div>

      <Card style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><Th>Date</Th><Th>Type</Th><Th>Category</Th><Th>Customer</Th><Th>Amount</Th><Th>Note</Th><Th></Th></tr></thead>
          <tbody>
            {visible.map((f) => (
              <tr key={f.id}>
                <Td mono>{f.entry_date}</Td>
                <Td><span style={{ color: f.type === "income" ? COLORS.green : COLORS.red, fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>{f.type}</span></Td>
                <Td>{f.category}</Td>
                <Td style={{ color: COLORS.textMuted }}>{customerName(f.customer_id)}</Td>
                <Td mono style={{ color: f.type === "income" ? COLORS.green : COLORS.red }}>{f.type === "income" ? "+" : "-"}{money(f.amount)}</Td>
                <Td style={{ color: COLORS.textMuted }}>{f.note}</Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    {f.type === "income" && f.customer_id && (
                      <Btn small kind="ghost" onClick={() => setReceiptEntry(f)}><ReceiptIcon size={12} /> Receipt</Btn>
                    )}
                    <Btn small kind="danger" onClick={() => remove(f.id)}><Trash2 size={12} /></Btn>
                  </div>
                </Td>
              </tr>
            ))}
            {visible.length === 0 && <tr><Td style={{ color: COLORS.textMuted }}>No entries yet.</Td></tr>}
          </tbody>
        </table>
      </Card>

      {receiptEntry && (
        <Receipt
          entry={receiptEntry}
          customer={customers.find((c) => c.id === receiptEntry.customer_id)}
          receivedBy={myName || myEmail}
          onClose={() => setReceiptEntry(null)}
        />
      )}
    </div>
  );
}

