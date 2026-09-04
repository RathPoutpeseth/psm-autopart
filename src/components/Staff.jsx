import React, { useState } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, Card, SectionHeader, Th, Td, Btn, Input, Field, DAYS, DAY_LABELS } from "../ui";

export default function Staff({ staff, refresh }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  async function addStaff() {
    if (!name.trim()) return;
    await supabase.from("staff_schedule").insert({ staff_name: name, role });
    setName(""); setRole("");
    refresh();
  }
  async function removeStaff(id) { await supabase.from("staff_schedule").delete().eq("id", id); refresh(); }
  async function setShift(id, day, val) {
    await supabase.from("staff_schedule").update({ [day]: val }).eq("id", id);
    refresh();
  }

  return (
    <div>
      <SectionHeader icon={CalendarDays} title="Staff Schedule" subtitle={`${staff.length} team members`} />

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></Field>
          <Field label="Role"><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Counter, Warehouse, Driver…" /></Field>
          <Btn kind="primary" onClick={addStaff}><Plus size={14} /> Add Staff</Btn>
        </div>
      </Card>

      <Card style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Name</Th><Th>Role</Th>
              {DAYS.map((d) => <Th key={d}>{DAY_LABELS[d]}</Th>)}
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id}>
                <Td style={{ fontWeight: 600 }}>{s.staff_name}</Td>
                <Td style={{ color: COLORS.textMuted }}>{s.role}</Td>
                {DAYS.map((d) => (
                  <Td key={d}>
                    <Input
                      defaultValue={s[d] || ""}
                      onBlur={(e) => setShift(s.id, d, e.target.value)}
                      placeholder="off"
                      style={{ width: 70, fontSize: 12, padding: "4px 6px" }}
                    />
                  </Td>
                ))}
                <Td><Btn small kind="danger" onClick={() => removeStaff(s.id)}><Trash2 size={12} /></Btn></Td>
              </tr>
            ))}
            {staff.length === 0 && <tr><Td style={{ color: COLORS.textMuted }}>No staff added yet.</Td></tr>}
          </tbody>
        </table>
      </Card>
      <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 8 }}>
        Enter shift times as text (e.g. "9-5" or "off"), then click away to save.
      </div>
    </div>
  );
}
