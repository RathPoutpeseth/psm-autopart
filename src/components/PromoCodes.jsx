import React, { useState } from "react";
import { Tag, Plus, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, Card, SectionHeader, Th, Td, Btn, Input, Select, Field, money } from "../ui";

const empty = { code: "", discount_type: "percent", discount_value: "", max_uses: "", expires_at: "" };

export default function PromoCodes({ promoCodes, refresh }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setError("");
    const code = form.code.trim().toUpperCase();
    if (!code || !form.discount_value) {
      setError("Code and discount amount are required.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.from("promo_codes").insert({
      code,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value) || 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
    });
    setBusy(false);
    if (err) {
      setError(err.message.includes("duplicate") ? "That code already exists." : err.message);
      return;
    }
    setForm(empty);
    refresh();
  }

  async function toggleActive(id, active) {
    await supabase.from("promo_codes").update({ active }).eq("id", id);
    refresh();
  }
  async function remove(id) {
    await supabase.from("promo_codes").delete().eq("id", id);
    refresh();
  }

  return (
    <div>
      <SectionHeader icon={Tag} title="Promo Codes" subtitle="Create discount codes your customers can use at checkout" />

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }} className="form-grid-4">
          <Field label="Code"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SAVE10" /></Field>
          <Field label="Discount Type">
            <Select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
              <option value="percent">% Percent</option>
              <option value="fixed">$ Fixed</option>
            </Select>
          </Field>
          <Field label={form.discount_type === "percent" ? "Discount (%)" : "Discount ($)"}>
            <Input type="number" min="0" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
          </Field>
          <Field label="Max Uses (optional)">
            <Input type="number" min="1" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" />
          </Field>
          <Field label="Expires (optional)">
            <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
          </Field>
        </div>
        {error && <div style={{ color: COLORS.red, fontSize: 12.5, marginTop: 10 }}>{error}</div>}
        <div style={{ marginTop: 12 }}>
          <Btn kind="primary" disabled={busy} onClick={save}><Plus size={14} /> Create Code</Btn>
        </div>
      </Card>

      <Card style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><Th>Code</Th><Th>Discount</Th><Th>Used</Th><Th>Expires</Th><Th>Active</Th><Th></Th></tr></thead>
          <tbody>
            {promoCodes.map((p) => (
              <tr key={p.id}>
                <Td mono style={{ color: COLORS.amber, fontWeight: 700 }}>{p.code}</Td>
                <Td mono>{p.discount_type === "percent" ? `${p.discount_value}%` : money(p.discount_value)}</Td>
                <Td mono style={{ color: COLORS.textMuted }}>{p.used_count}{p.max_uses ? ` / ${p.max_uses}` : ""}</Td>
                <Td mono style={{ color: COLORS.textMuted }}>{p.expires_at || "Never"}</Td>
                <Td>
                  <Select value={p.active ? "yes" : "no"} onChange={(e) => toggleActive(p.id, e.target.value === "yes")} style={{ width: 90 }}>
                    <option value="yes">Active</option>
                    <option value="no">Off</option>
                  </Select>
                </Td>
                <Td><Btn small kind="danger" onClick={() => remove(p.id)}><Trash2 size={12} /></Btn></Td>
              </tr>
            ))}
            {promoCodes.length === 0 && <tr><Td style={{ color: COLORS.textMuted }}>No promo codes yet.</Td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
