import React, { useState } from "react";
import { Package, Plus, Trash2, Pencil, X, Check, Search, ImagePlus } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, Card, SectionHeader, Th, Td, PartTag, Btn, Input, Field, money } from "../ui";

const empty = { id: null, part_no: "", name: "", brand: "", category: "", cost: "", price: "", qty: "", reorder_point: "", image_url: "" };

export default function Inventory({ inventory, refresh, role }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("inventory-images").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("inventory-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
    } else {
      alert("Photo upload failed: " + error.message);
    }
    setUploading(false);
  }
  const canEditPricing = role === "owner" || role === "manager";
  const canDelete = role === "owner" || role === "manager";

  const filtered = inventory.filter((i) =>
    [i.part_no, i.name, i.brand, i.category].join(" ").toLowerCase().includes(query.toLowerCase())
  );

  function startNew() { setForm(empty); setEditing("new"); }
  function startEdit(item) { setForm(item); setEditing(item.id); }
  function cancel() { setEditing(null); setForm(empty); }

  async function save() {
    if (!form.part_no.trim() || !form.name.trim()) return;
    setBusy(true);
    const row = {
      part_no: form.part_no, name: form.name, brand: form.brand, category: form.category,
      cost: Number(form.cost) || 0, price: Number(form.price) || 0,
      qty: Number(form.qty) || 0, reorder_point: Number(form.reorder_point) || 0,
      image_url: form.image_url || null,
    };
    if (editing === "new") {
      await supabase.from("inventory").insert(row);
    } else {
      await supabase.from("inventory").update(row).eq("id", form.id);
    }
    setBusy(false);
    cancel();
    refresh();
  }

  async function remove(id) {
    await supabase.from("inventory").delete().eq("id", id);
    refresh();
  }

  return (
    <div>
      <SectionHeader
        icon={Package}
        title="Inventory"
        subtitle={`${inventory.length} parts on file`}
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <Search size={14} color={COLORS.textMuted} style={{ position: "absolute", left: 8, top: 9 }} />
              <Input placeholder="Search parts…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 28, width: 200 }} />
            </div>
            <Btn kind="primary" onClick={startNew}><Plus size={14} /> Add Part</Btn>
          </div>
        }
      />

      {editing && (
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} className="form-grid-4">
            <Field label="Part #"><Input value={form.part_no} onChange={(e) => setForm({ ...form, part_no: e.target.value })} placeholder="BRK-2201" /></Field>
            <Field label="Name" wide><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Brand"><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Field>
            <Field label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
            {canEditPricing && (
              <>
                <Field label="Cost ($)"><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></Field>
                <Field label="Price ($)"><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
              </>
            )}
            <Field label="Qty on Hand"><Input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></Field>
            <Field label="Reorder Point"><Input type="number" value={form.reorder_point} onChange={(e) => setForm({ ...form, reorder_point: e.target.value })} /></Field>
            <Field label="Photo" wide>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {form.image_url && (
                  <img src={form.image_url} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, border: `1px solid ${COLORS.border}` }} />
                )}
                <label style={{
                  display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
                  fontSize: 12, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`,
                  borderRadius: 4, padding: "6px 10px",
                }}>
                  <ImagePlus size={13} />
                  {uploading ? "Uploading…" : form.image_url ? "Change photo" : "Add photo"}
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} disabled={uploading} />
                </label>
              </div>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn kind="primary" disabled={busy} onClick={save}><Check size={14} /> Save</Btn>
            <Btn kind="ghost" onClick={cancel}><X size={14} /> Cancel</Btn>
          </div>
        </Card>
      )}

      <Card style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr><Th>Photo</Th><Th>Part #</Th><Th>Name</Th><Th>Brand</Th><Th>Category</Th><Th>Cost</Th><Th>Price</Th><Th>Qty</Th><Th>Reorder</Th><Th></Th></tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} style={{ background: i.qty <= i.reorder_point ? "#2a1414" : "transparent" }}>
                <Td>
                  {i.image_url ? (
                    <img src={i.image_url} alt="" style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 4, border: `1px solid ${COLORS.border}` }} />
                  ) : (
                    <div style={{ width: 34, height: 34, borderRadius: 4, background: COLORS.panelAlt, border: `1px solid ${COLORS.border}` }} />
                  )}
                </Td>
                <Td mono><PartTag>{i.part_no}</PartTag></Td>
                <Td>{i.name}</Td>
                <Td>{i.brand}</Td>
                <Td>{i.category}</Td>
                <Td mono>{money(i.cost)}</Td>
                <Td mono>{money(i.price)}</Td>
                <Td mono style={{ color: i.qty <= i.reorder_point ? COLORS.red : COLORS.text, fontWeight: 600 }}>{i.qty}</Td>
                <Td mono>{i.reorder_point}</Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn small kind="ghost" onClick={() => startEdit(i)}><Pencil size={12} /></Btn>
                    {canDelete && <Btn small kind="danger" onClick={() => remove(i.id)}><Trash2 size={12} /></Btn>}
                  </div>
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><Td style={{ color: COLORS.textMuted }}>No parts match "{query}".</Td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
