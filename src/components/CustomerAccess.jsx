import React, { useState } from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, Card, SectionHeader, Th, Td, Btn, Input, Select, Field } from "../ui";

const empty = { authUserId: "", customerId: "", email: "", username: "" };

export default function CustomerAccess({ customerProfiles, customers, refresh }) {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    if (!form.authUserId.trim() || !form.customerId || !form.email.trim() || !form.username.trim()) {
      setError("Every field is required — Auth User ID, Customer, Login Email, and Username.");
      return;
    }
    setBusy(true);
    // Every new login automatically gets a default "sales" staff profile
    // (see roles migration) — remove that leftover before linking as a customer,
    // so they don't also show up in the staff Team list.
    await supabase.from("profiles").delete().eq("id", form.authUserId.trim());
    const { error: err } = await supabase.from("customer_profiles").insert({
      id: form.authUserId.trim(),
      customer_id: form.customerId,
      email: form.email.trim(),
      username: form.username.trim(),
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setForm(empty);
    refresh();
  }

  async function remove(id) {
    await supabase.from("customer_profiles").delete().eq("id", id);
    refresh();
  }

  const customerName = (id) => customers.find((c) => c.id === id)?.name || "—";

  return (
    <div>
      <SectionHeader icon={KeyRound} title="Customer Access" subtitle="Give a customer a login to your ordering portal" />

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, color: COLORS.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
          <b>1.</b> Supabase → Authentication → Users → Add user. Type any email here (it can be made up, e.g. <code>chanthorn@kzmall.local</code> — the customer will never see it), set a password, make sure "Auto Confirm User" is checked.<br />
          <b>2.</b> Click into that new user and copy their <b>User UID</b>.<br />
          <b>3.</b> Fill in the form below — the <b>Login Email</b> here must be typed <i>exactly</i> the same as what you entered in step 1. The <b>Username</b> is what the customer will actually type to log in — pick something simple, like their name.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} className="form-grid-4">
          <Field label="Auth User ID (UUID)" wide>
            <Input value={form.authUserId} onChange={(e) => setForm({ ...form, authUserId: e.target.value })} placeholder="Paste UUID from Supabase Users list" />
          </Field>
          <Field label="Customer">
            <Select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              <option value="">Select customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Login Email (must match Step 1 exactly)">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="chanthorn@kzmall.local" />
          </Field>
          <Field label="Username (what customer types to log in)">
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="chanthorn" />
          </Field>
        </div>
        {error && <div style={{ color: COLORS.red, fontSize: 12.5, marginTop: 10 }}>{error}</div>}
        <div style={{ marginTop: 12 }}>
          <Btn kind="primary" disabled={busy} onClick={save}><Plus size={14} /> Link Account</Btn>
        </div>
      </Card>

      <Card style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><Th>Customer</Th><Th>Username</Th><Th>Login Email</Th><Th>Auth User ID</Th><Th></Th></tr></thead>
          <tbody>
            {customerProfiles.map((cp) => (
              <tr key={cp.id}>
                <Td>{customerName(cp.customer_id)}</Td>
                <Td mono style={{ color: COLORS.amber, fontWeight: 600 }}>{cp.username}</Td>
                <Td style={{ color: COLORS.textMuted }}>{cp.email}</Td>
                <Td mono style={{ fontSize: 11, color: COLORS.textMuted }}>{cp.id}</Td>
                <Td><Btn small kind="danger" onClick={() => remove(cp.id)}><Trash2 size={12} /></Btn></Td>
              </tr>
            ))}
            {customerProfiles.length === 0 && <tr><Td style={{ color: COLORS.textMuted }}>No customer logins set up yet.</Td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
