import React, { useState } from "react";
import { Truck, Plus, Trash2, Pencil, X, Check, Paperclip, ExternalLink } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, Card, StatCard, SectionHeader, Th, Td, Btn, Input, Select, Field, money } from "../ui";

const emptySupplier = { id: null, name: "", contact: "", phone: "", address: "", notes: "" };
const emptyBill = { supplier_id: "", invoice_number: "", invoice_date: new Date().toISOString().slice(0, 10), amount: "", status: "Unpaid", note: "" };

export default function Suppliers({ suppliers, supplierInvoices, refresh }) {
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [billForm, setBillForm] = useState(emptyBill);
  const [addingBill, setAddingBill] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);

  function balanceFor(supplierId) {
    return supplierInvoices
      .filter((b) => b.supplier_id === supplierId && b.status !== "Paid")
      .reduce((s, b) => s + Number(b.amount), 0);
  }
  const totalOwed = supplierInvoices.filter((b) => b.status !== "Paid").reduce((s, b) => s + Number(b.amount), 0);

  function startNewSupplier() { setSupplierForm(emptySupplier); setEditingSupplier("new"); }
  function startEditSupplier(s) { setSupplierForm(s); setEditingSupplier(s.id); }
  async function saveSupplier() {
    if (!supplierForm.name.trim()) return;
    const row = { name: supplierForm.name, contact: supplierForm.contact, phone: supplierForm.phone, address: supplierForm.address, notes: supplierForm.notes };
    if (editingSupplier === "new") await supabase.from("suppliers").insert(row);
    else await supabase.from("suppliers").update(row).eq("id", supplierForm.id);
    setEditingSupplier(null); setSupplierForm(emptySupplier);
    refresh();
  }
  async function removeSupplier(id) { await supabase.from("suppliers").delete().eq("id", id); refresh(); }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
  }

  async function saveBill() {
    if (!billForm.supplier_id || !billForm.amount) return;
    setUploading(true);
    let file_url = null;
    if (pendingFile) {
      const path = `${Date.now()}-${pendingFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("supplier-invoices").upload(path, pendingFile);
      if (!error) file_url = path;
      else alert("File upload failed: " + error.message);
    }
    await supabase.from("supplier_invoices").insert({
      supplier_id: billForm.supplier_id, invoice_number: billForm.invoice_number,
      invoice_date: billForm.invoice_date, amount: Number(billForm.amount) || 0,
      status: billForm.status, note: billForm.note, file_url,
    });
    setUploading(false);
    setBillForm(emptyBill);
    setPendingFile(null);
    setAddingBill(false);
    refresh();
  }
  async function removeBill(id) { await supabase.from("supplier_invoices").delete().eq("id", id); refresh(); }
  async function setBillStatus(id, status) {
    const bill = supplierInvoices.find((b) => b.id === id);
    await supabase.from("supplier_invoices").update({ status }).eq("id", id);
    if (status === "Paid" && bill && !bill.expense_logged) {
      await supabase.from("finances").insert({
        entry_date: new Date().toISOString().slice(0, 10),
        type: "expense",
        category: "Supplier Payment",
        amount: Number(bill.amount) || 0,
        note: `${supplierName(bill.supplier_id)}${bill.invoice_number ? " — Invoice " + bill.invoice_number : ""}`,
      });
      await supabase.from("supplier_invoices").update({ expense_logged: true }).eq("id", id);
    }
    refresh();
  }

  async function viewFile(path) {
    const { data, error } = await supabase.storage.from("supplier-invoices").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else alert("Couldn't open file: " + (error?.message || "unknown error"));
  }

  const supplierName = (id) => suppliers.find((s) => s.id === id)?.name || "—";

  return (
    <div>
      <SectionHeader icon={Truck} title="Suppliers" subtitle="Bills and balances owed to your suppliers" />

      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard icon={Truck} label="Total Owed to Suppliers" value={money(totalOwed)} tone={totalOwed > 0 ? "danger" : "good"} />
        <StatCard icon={Truck} label="Suppliers on File" value={suppliers.length} />
      </div>

      {/* Suppliers list */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontFamily: "Oswald, sans-serif", textTransform: "uppercase", fontSize: 15, letterSpacing: "0.04em", color: COLORS.text }}>Suppliers</div>
        <Btn kind="primary" onClick={startNewSupplier}><Plus size={14} /> Add Supplier</Btn>
      </div>

      {editingSupplier && (
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} className="form-grid-4">
            <Field label="Supplier Name" wide><Input value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} /></Field>
            <Field label="Contact"><Input value={supplierForm.contact} onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })} /></Field>
            <Field label="Phone"><Input value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} /></Field>
            <Field label="Address" wide><Input value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} /></Field>
            <Field label="Notes" wide><Input value={supplierForm.notes} onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })} /></Field>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn kind="primary" onClick={saveSupplier}><Check size={14} /> Save</Btn>
            <Btn kind="ghost" onClick={() => { setEditingSupplier(null); setSupplierForm(emptySupplier); }}><X size={14} /> Cancel</Btn>
          </div>
        </Card>
      )}

      <Card style={{ overflow: "auto", marginBottom: 26 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><Th>Name</Th><Th>Contact</Th><Th>Phone</Th><Th>Address</Th><Th>Balance Owed</Th><Th></Th></tr></thead>
          <tbody>
            {suppliers.map((s) => {
              const balance = balanceFor(s.id);
              return (
                <tr key={s.id}>
                  <Td>{s.name}</Td><Td>{s.contact}</Td><Td mono>{s.phone}</Td>
                  <Td style={{ color: COLORS.textMuted }}>{s.address}</Td>
                  <Td mono style={{ color: balance > 0 ? COLORS.red : COLORS.textMuted, fontWeight: balance > 0 ? 700 : 400 }}>{money(balance)}</Td>
                  <Td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn small kind="ghost" onClick={() => startEditSupplier(s)}><Pencil size={12} /></Btn>
                      <Btn small kind="danger" onClick={() => removeSupplier(s.id)}><Trash2 size={12} /></Btn>
                    </div>
                  </Td>
                </tr>
              );
            })}
            {suppliers.length === 0 && <tr><Td style={{ color: COLORS.textMuted }}>No suppliers yet.</Td></tr>}
          </tbody>
        </table>
      </Card>

      {/* Supplier bills / invoices */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontFamily: "Oswald, sans-serif", textTransform: "uppercase", fontSize: 15, letterSpacing: "0.04em", color: COLORS.text }}>Supplier Bills</div>
        <Btn kind="primary" onClick={() => setAddingBill(!addingBill)}><Plus size={14} /> Log Bill</Btn>
      </div>

      {addingBill && (
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }} className="form-grid-4">
            <Field label="Supplier">
              <Select value={billForm.supplier_id} onChange={(e) => setBillForm({ ...billForm, supplier_id: e.target.value })}>
                <option value="">Select supplier…</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="Invoice #"><Input value={billForm.invoice_number} onChange={(e) => setBillForm({ ...billForm, invoice_number: e.target.value })} placeholder="Supplier's invoice ref" /></Field>
            <Field label="Date"><Input type="date" value={billForm.invoice_date} onChange={(e) => setBillForm({ ...billForm, invoice_date: e.target.value })} /></Field>
            <Field label="Amount ($)"><Input type="number" step="0.01" value={billForm.amount} onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })} /></Field>
            <Field label="Status">
              <Select value={billForm.status} onChange={(e) => setBillForm({ ...billForm, status: e.target.value })}>
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </Select>
            </Field>
            <Field label="Note"><Input value={billForm.note} onChange={(e) => setBillForm({ ...billForm, note: e.target.value })} /></Field>
            <Field label="Attach Invoice File" wide>
              <label style={{
                display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
                fontSize: 12, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`,
                borderRadius: 4, padding: "6px 10px",
              }}>
                <Paperclip size={13} />
                {pendingFile ? pendingFile.name : "Choose photo or PDF"}
                <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={{ display: "none" }} />
              </label>
            </Field>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Btn kind="primary" disabled={uploading} onClick={saveBill}><Check size={14} /> Save Bill</Btn>
            <Btn kind="ghost" onClick={() => { setAddingBill(false); setBillForm(emptyBill); setPendingFile(null); }}><X size={14} /> Cancel</Btn>
          </div>
        </Card>
      )}

      <Card style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><Th>Date</Th><Th>Supplier</Th><Th>Invoice #</Th><Th>Amount</Th><Th>Status</Th><Th>File</Th><Th>Note</Th><Th></Th></tr></thead>
          <tbody>
            {supplierInvoices.map((b) => (
              <tr key={b.id}>
                <Td mono>{b.invoice_date}</Td>
                <Td>{supplierName(b.supplier_id)}</Td>
                <Td mono>{b.invoice_number}</Td>
                <Td mono style={{ color: b.status === "Paid" ? COLORS.green : COLORS.red, fontWeight: 600 }}>{money(b.amount)}</Td>
                <Td>
                  <Select value={b.status} onChange={(e) => setBillStatus(b.id, e.target.value)} style={{ width: 100 }}>
                    <option>Unpaid</option><option>Paid</option>
                  </Select>
                </Td>
                <Td>
                  {b.file_url ? (
                    <Btn small kind="ghost" onClick={() => viewFile(b.file_url)}><ExternalLink size={12} /> View</Btn>
                  ) : (
                    <span style={{ color: COLORS.textMuted, fontSize: 12 }}>—</span>
                  )}
                </Td>
                <Td style={{ color: COLORS.textMuted }}>{b.note}</Td>
                <Td><Btn small kind="danger" onClick={() => removeBill(b.id)}><Trash2 size={12} /></Btn></Td>
              </tr>
            ))}
            {supplierInvoices.length === 0 && <tr><Td style={{ color: COLORS.textMuted }}>No supplier bills logged yet.</Td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
