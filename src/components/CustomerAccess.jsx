import React, { useState } from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { authHelperClient } from "../supabaseAuthHelper";
import { COLORS, Card, SectionHeader, Th, Td, Btn, Input, Select, Field } from "../ui";

const empty = { customerId: "", username: "", password: "" };

export default function CustomerAccess({ customerProfiles, customers, refresh }) {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    const username = form.username.trim().toLowerCase();
    if (!form.customerId || !username || !form.password) {
      setError("Every field is required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);

    const syntheticEmail = `${username}@kzmall-customer.com`;

    // Create the actual login using the isolated helper client, so this never
    // touches or replaces the owner's own logged-in session.
    const { data: signUpData, error: signUpErr } = await authHelperClient.auth.signUp({
      email: syntheticEmail,
      password: form.password,
    });

    if (signUpErr) {
      setBusy(false);
      if (signUpErr.message?.toLowerCase().includes("already registered")) {
        setError("That username is already taken.");
      } else if (signUpErr.message?.toLowerCase().includes("confirm")) {
        setError('Email confirmation is still required on your Supabase project. Go to Supabase → Authentication → Providers → Email, and turn OFF "Confirm email" once — then try again.');
      } else {
        setError(signUpErr.message);
      }
      return;
    }

    const newUserId = signUpData?.user?.id;
    if (!newUserId) {
      setBusy(false);
      setError("Something went wrong creating the login. Please try again.");
      return;
    }

    // Every brand-new login automatically gets a default "sales" staff
    // profile — remove that before linking as a customer.
    await supabase.from("profiles").delete().eq("id", newUserId);

    const { error: linkErr } = await supabase.from("customer_profiles").insert({
      id: newUserId,
      customer_id: form.customerId,
      email: syntheticEmail,
      username,
    });

    setBusy(false);
    if (linkErr) { setError(linkErr.message); return; }
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
          Pick a customer, give them a username and a password — that's it. No email needed, no Supabase dashboard step.
          <br /><b>One-time setup:</b> if this is your first customer login ever, go to Supabase → Authentication → Providers → Email, and turn <b>OFF</b> "Confirm email" — otherwise the account won't work until it "confirms" an email that doesn't really exist.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} className="form-grid-4">
          <Field label="Customer">
            <Select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              <option value="">Select customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Username">
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. chanthorn" />
          </Field>
          <Field label="Password">
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
          </Field>
        </div>
        {error && <div style={{ color: COLORS.red, fontSize: 12.5, marginTop: 10, lineHeight: 1.5 }}>{error}</div>}
        <div style={{ marginTop: 12 }}>
          <Btn kind="primary" disabled={busy} onClick={save}><Plus size={14} /> Create Login</Btn>
        </div>
      </Card>

      <Card style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><Th>Customer</Th><Th>Username</Th><Th></Th></tr></thead>
          <tbody>
            {customerProfiles.map((cp) => (
              <tr key={cp.id}>
                <Td>{customerName(cp.customer_id)}</Td>
                <Td mono style={{ color: COLORS.amber, fontWeight: 600 }}>{cp.username}</Td>
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
