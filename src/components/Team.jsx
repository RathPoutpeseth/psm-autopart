import React, { useState } from "react";
import { Shield, Check } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, Card, SectionHeader, Th, Td, Select, Input, Btn } from "../ui";

const ROLES = ["owner", "manager", "warehouse", "sales"];

export default function Team({ profiles, refresh, myId }) {
  const [names, setNames] = useState({}); // { [profileId]: draftValue }

  async function setRole(id, role) {
    await supabase.from("profiles").update({ role }).eq("id", id);
    refresh();
  }

  async function saveName(id) {
    const value = names[id];
    if (value === undefined) return;
    await supabase.from("profiles").update({ full_name: value }).eq("id", id);
    setNames((n) => { const next = { ...n }; delete next[id]; return next; });
    refresh();
  }

  return (
    <div>
      <SectionHeader icon={Shield} title="Team" subtitle="Set what each person can access" />
      <Card style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><Th>Email</Th><Th>Full Name</Th><Th>Role</Th></tr></thead>
          <tbody>
            {profiles.map((p) => {
              const draft = names[p.id] !== undefined ? names[p.id] : (p.full_name || "");
              const dirty = names[p.id] !== undefined && names[p.id] !== (p.full_name || "");
              return (
                <tr key={p.id}>
                  <Td>{p.email} {p.id === myId && <span style={{ color: COLORS.textMuted, fontSize: 11 }}>(you)</span>}</Td>
                  <Td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Input
                        value={draft}
                        onChange={(e) => setNames((n) => ({ ...n, [p.id]: e.target.value }))}
                        placeholder="e.g. Rath Seth"
                        style={{ width: 160 }}
                      />
                      {dirty && (
                        <Btn small kind="primary" onClick={() => saveName(p.id)}><Check size={12} /></Btn>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <Select value={p.role} onChange={(e) => setRole(p.id, e.target.value)} style={{ width: 140 }}>
                      {ROLES.map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
                    </Select>
                  </Td>
                </tr>
              );
            })}
            {profiles.length === 0 && <tr><Td style={{ color: COLORS.textMuted }}>No team members yet.</Td></tr>}
          </tbody>
        </table>
      </Card>
      <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 8, lineHeight: 1.6 }}>
        <b>Owner / Manager</b> — full access, including Finances and Staff Schedule.<br />
        <b>Warehouse</b> — manage inventory and fulfill orders; no finances, no pricing edits, no staff schedule.<br />
        <b>Sales</b> — manage customers and create orders; no finances, no inventory editing, no staff schedule.<br />
        <b>Full Name</b> — shown on invoices/receipts as the Sales Signature instead of an email. Type a name and click the checkmark to save.
      </div>
    </div>
  );
}
