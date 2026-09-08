import React, { useState } from "react";
import { ClipboardList, Plus, Trash2, Check, X, FileText, Pencil } from "lucide-react";
import { supabase } from "../supabaseClient";
import { COLORS, Card, SectionHeader, Th, Td, PartTag, Btn, Input, Select, Field, money } from "../ui";
import Invoice from "./Invoice";

export default function Orders({ orders, customers, inventory, refresh, role, myEmail, myName }) {
  const canDelete = role === "owner" || role === "manager";
  const canEditOrder = role === "owner" || role === "manager";
  const [creating, setCreating] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null); // { ...order, items }
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([]);
  const [linePart, setLinePart] = useState("");
  const [partQuery, setPartQuery] = useState("");
  const [showPartDropdown, setShowPartDropdown] = useState(false);
  const [lineQty, setLineQty] = useState(1);
  const [lineDiscountType, setLineDiscountType] = useState("fixed");
  const [lineDiscountValue, setLineDiscountValue] = useState("");
  const [busy, setBusy] = useState(false);

  // --- Editing an existing order (reconcile actual quantities sold) ---
  const [editingOrder, setEditingOrder] = useState(null); // the order row
  const [editLines, setEditLines] = useState([]); // current editable state
  const [originalEditLines, setOriginalEditLines] = useState([]); // snapshot for stock delta
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  function addLine() {
    const part = inventory.find((i) => i.id === linePart);
    if (!part || lineQty <= 0) return;
    const discountValue = Number(lineDiscountValue) || 0;
    const discountPerUnit = lineDiscountType === "percent" ? part.price * discountValue / 100 : discountValue;
    const finalPrice = Math.max(0, part.price - discountPerUnit);
    setLines([...lines, {
      partId: part.id, part_no: part.part_no, name: part.name, qty: Number(lineQty),
      price: finalPrice, original_price: part.price,
      discount_type: lineDiscountType, discount_value: discountValue,
    }]);
    setLinePart(""); setPartQuery(""); setLineQty(1); setLineDiscountType("fixed"); setLineDiscountValue("");
  }
  function removeLine(idx) { setLines(lines.filter((_, i) => i !== idx)); }
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);

  async function saveOrder() {
    if (!customerId || lines.length === 0) return;
    setBusy(true);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({ customer_id: customerId, order_date: new Date().toISOString().slice(0, 10), status: "Open", created_by_email: myEmail, created_by_name: myName || null, total })
      .select()
      .single();

    if (!error && order) {
      await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id, part_id: l.partId, part_no: l.part_no, name: l.name, qty: l.qty,
          price: l.price, original_price: l.original_price, discount_type: l.discount_type, discount_value: l.discount_value,
        }))
      );
      // deduct stock
      for (const l of lines) {
        const part = inventory.find((i) => i.id === l.partId);
        if (part) {
          await supabase.from("inventory").update({ qty: Math.max(0, part.qty - l.qty) }).eq("id", part.id);
        }
      }
    }
    setBusy(false);
    setLines([]);
    setCreating(false);
    refresh();
  }

  async function setStatus(orderId, status) {
    const order = orders.find((o) => o.id === orderId);
    await supabase.from("orders").update({ status }).eq("id", orderId);
    if (status === "Paid" && order && !order.income_logged) {
      // Skip the lump-sum log if this order was already reconciled — its
      // items would have logged their own income individually at that point.
      const { data: itemFlags } = await supabase.from("order_items").select("income_logged").eq("order_id", orderId);
      const alreadyItemized = (itemFlags || []).some((i) => i.income_logged);
      if (!alreadyItemized) {
        const { data: entry } = await supabase.from("finances").insert({
          entry_date: new Date().toISOString().slice(0, 10),
          type: "income",
          category: "Order Payment",
          amount: Number(order.total) || 0,
          customer_id: order.customer_id,
          note: `${customerName(order.customer_id)} — Order #${order.id.slice(0, 8).toUpperCase()}`,
        }).select().single();
        if (entry) {
          await supabase.from("orders").update({ income_logged: true, income_finance_id: entry.id }).eq("id", orderId);
        }
      }
    }
    refresh();
  }
  async function removeOrder(id) {
    await supabase.from("orders").delete().eq("id", id);
    refresh();
  }

  async function openInvoice(order) {
    setLoadingInvoice(true);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    setInvoiceOrder({ ...order, items: data || [] });
    setLoadingInvoice(false);
  }

  async function openEditOrder(order) {
    setLoadingEdit(true);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    const snapshot = (data || []).map((l) => ({ ...l }));
    setEditingOrder(order);
    setOriginalEditLines(snapshot);
    setEditLines(snapshot.map((l) => ({ ...l })));
    setLoadingEdit(false);
  }

  function setEditQty(itemId, qty) {
    setEditLines((ls) => ls.map((l) => (l.id === itemId ? { ...l, qty: Math.max(0, Number(qty) || 0) } : l)));
  }

  const editTotal = editLines.reduce((s, l) => s + l.qty * l.price, 0);

  async function saveEdit() {
    setSavingEdit(true);
    for (const line of editLines) {
      const original = originalEditLines.find((o) => o.id === line.id);
      const delta = (original?.qty || 0) - line.qty; // positive = fewer sold, return stock; negative = sold more, deduct further
      if (line.part_id && delta !== 0) {
        const part = inventory.find((i) => i.id === line.part_id);
        if (part) {
          await supabase.from("inventory").update({ qty: Math.max(0, part.qty + delta) }).eq("id", part.id);
        }
      }

      if (line.qty === 0) {
        // Nothing sold after all — remove any income already logged for it.
        if (line.income_logged && line.income_finance_id) {
          await supabase.from("finances").delete().eq("id", line.income_finance_id);
        }
        await supabase.from("order_items").delete().eq("id", line.id);
        continue;
      }

      const amount = line.qty * line.price;
      if (line.qty !== original?.qty) {
        await supabase.from("order_items").update({ qty: line.qty }).eq("id", line.id);
      }

      if (line.income_logged && line.income_finance_id) {
        // Already logged in a previous reconcile — just keep the amount in sync.
        await supabase.from("finances").update({ amount }).eq("id", line.income_finance_id);
      } else {
        // First time this item is being confirmed as sold — log it now.
        const { data: entry } = await supabase.from("finances").insert({
          entry_date: new Date().toISOString().slice(0, 10),
          type: "income",
          category: "Item Sold",
          amount,
          customer_id: editingOrder.customer_id,
          note: `${customerName(editingOrder.customer_id)} — ${line.part_no} ${line.name} × ${line.qty}`,
        }).select().single();
        if (entry) {
          await supabase.from("order_items").update({ income_logged: true, income_finance_id: entry.id }).eq("id", line.id);
        }
      }
    }
    await supabase.from("orders").update({ total: editTotal }).eq("id", editingOrder.id);
    setSavingEdit(false);
    setEditingOrder(null);
    setEditLines([]);
    setOriginalEditLines([]);
    refresh();
  }

  const customerName = (id) => customers.find((c) => c.id === id)?.name || "—";

  return (
    <div>
      <SectionHeader
        icon={ClipboardList}
        title="Orders"
        subtitle={`${orders.length} logged`}
        right={<Btn kind="primary" onClick={() => setCreating(!creating)}><Plus size={14} /> New Order</Btn>}
      />

      {creating && (
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <Field label="Customer">
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Select customer…</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 12, flexWrap: "wrap" }}>
            <Field label="Part">
              <div style={{ position: "relative" }}>
                <Input
                  value={partQuery}
                  onChange={(e) => { setPartQuery(e.target.value); setLinePart(""); setShowPartDropdown(true); }}
                  onFocus={() => setShowPartDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPartDropdown(false), 150)}
                  placeholder="Type part # or name…"
                  className="mobile-full-width"
                  style={{ width: 220 }}
                />
                {showPartDropdown && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, marginTop: 2,
                    background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4,
                    maxHeight: 220, overflowY: "auto", boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                  }}>
                    {inventory
                      .filter((i) => {
                        const q = partQuery.toLowerCase();
                        return !q || i.part_no.toLowerCase().includes(q) || i.name.toLowerCase().includes(q) || (i.brand || "").toLowerCase().includes(q);
                      })
                      .slice(0, 30)
                      .map((i) => (
                        <div
                          key={i.id}
                          onMouseDown={() => { setLinePart(i.id); setPartQuery(`${i.part_no} — ${i.name}`); setShowPartDropdown(false); }}
                          style={{ padding: "8px 10px", cursor: "pointer", fontSize: 12.5, color: COLORS.text, borderBottom: `1px solid ${COLORS.border}55` }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.steel)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.amber }}>{i.part_no}</span> — {i.name}
                          <span style={{ color: COLORS.textMuted, marginLeft: 6 }}>({i.qty} in stock)</span>
                        </div>
                      ))}
                    {inventory.filter((i) => {
                      const q = partQuery.toLowerCase();
                      return !q || i.part_no.toLowerCase().includes(q) || i.name.toLowerCase().includes(q) || (i.brand || "").toLowerCase().includes(q);
                    }).length === 0 && (
                      <div style={{ padding: "8px 10px", fontSize: 12.5, color: COLORS.textMuted }}>No parts match.</div>
                    )}
                  </div>
                )}
              </div>
            </Field>
            <Field label="Qty"><Input type="number" min="1" value={lineQty} onChange={(e) => setLineQty(e.target.value)} style={{ width: 70 }} /></Field>
            <Field label="Discount">
              <Select value={lineDiscountType} onChange={(e) => setLineDiscountType(e.target.value)} style={{ width: 90 }}>
                <option value="fixed">$</option>
                <option value="percent">%</option>
              </Select>
            </Field>
            <Field label="Amount">
              <Input type="number" min="0" step="0.01" value={lineDiscountValue} onChange={(e) => setLineDiscountValue(e.target.value)} placeholder="0" style={{ width: 90 }} />
            </Field>
            <Btn onClick={addLine}><Plus size={14} /> Add Line</Btn>
          </div>

          {lines.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
              <thead><tr><Th>Part</Th><Th>Qty</Th><Th>Unit Price</Th><Th>Discount</Th><Th>Subtotal</Th><Th></Th></tr></thead>
              <tbody>
                {lines.map((l, idx) => {
                  const hasDiscount = l.original_price > l.price;
                  return (
                    <tr key={idx}>
                      <Td mono><PartTag>{l.part_no}</PartTag> {l.name}</Td>
                      <Td mono>{l.qty}</Td>
                      <Td mono>
                        {hasDiscount && <span style={{ textDecoration: "line-through", color: COLORS.textMuted, marginRight: 6 }}>{money(l.original_price)}</span>}
                        {money(l.price)}
                      </Td>
                      <Td mono style={{ color: hasDiscount ? COLORS.red : COLORS.textMuted }}>
                        {hasDiscount ? (l.discount_type === "percent" ? `${l.discount_value}%` : money(l.discount_value)) : "—"}
                      </Td>
                      <Td mono>{money(l.qty * l.price)}</Td>
                      <Td><Btn small kind="danger" onClick={() => removeLine(idx)}><Trash2 size={12} /></Btn></Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, color: COLORS.amber, fontWeight: 700 }}>Total: {money(total)}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn kind="primary" disabled={busy} onClick={saveOrder}><Check size={14} /> Save Order</Btn>
              <Btn kind="ghost" onClick={() => { setCreating(false); setLines([]); }}><X size={14} /> Cancel</Btn>
            </div>
          </div>
        </Card>
      )}

      {editingOrder && (
        <Card style={{ padding: 16, marginBottom: 16, borderLeft: `4px solid ${COLORS.amber}` }}>
          <div style={{ fontFamily: "Oswald, sans-serif", textTransform: "uppercase", fontSize: 14, letterSpacing: "0.04em", color: COLORS.text, marginBottom: 4 }}>
            Reconcile Order — {customerName(editingOrder.customer_id)}
          </div>
          <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginBottom: 12 }}>
            Adjust each quantity to match what was actually sold. Set to 0 to remove an item entirely. Stock and the order total update automatically.
          </div>
          {loadingEdit ? (
            <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Loading…</div>
          ) : (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
                <thead><tr><Th>Part</Th><Th>Unit Price</Th><Th>Original Qty</Th><Th>Actual Qty Sold</Th><Th>Subtotal</Th></tr></thead>
                <tbody>
                  {editLines.map((l) => {
                    const original = originalEditLines.find((o) => o.id === l.id);
                    return (
                      <tr key={l.id} style={{ background: l.qty === 0 ? "#2a1414" : "transparent" }}>
                        <Td mono><PartTag>{l.part_no}</PartTag> {l.name}</Td>
                        <Td mono>{money(l.price)}</Td>
                        <Td mono style={{ color: COLORS.textMuted }}>{original?.qty}</Td>
                        <Td><Input type="number" min="0" value={l.qty} onChange={(e) => setEditQty(l.id, e.target.value)} style={{ width: 80 }} /></Td>
                        <Td mono>{money(l.qty * l.price)}</Td>
                      </tr>
                    );
                  })}
                  {editLines.length === 0 && <tr><Td style={{ color: COLORS.textMuted }}>No line items on this order.</Td></tr>}
                </tbody>
              </table>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, color: COLORS.amber, fontWeight: 700 }}>
                  New Total: {money(editTotal)}
                  {editTotal !== Number(editingOrder.total) && (
                    <span style={{ fontSize: 12, color: COLORS.textMuted, marginLeft: 8 }}>(was {money(editingOrder.total)})</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn kind="primary" disabled={savingEdit} onClick={saveEdit}><Check size={14} /> Save Changes</Btn>
                  <Btn kind="ghost" onClick={() => { setEditingOrder(null); setEditLines([]); setOriginalEditLines([]); }}><X size={14} /> Cancel</Btn>
                </div>
              </div>
            </>
          )}
        </Card>
      )}

      <Card style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><Th>Date</Th><Th>Customer</Th><Th>Total</Th><Th>Status</Th><Th></Th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <Td mono>{o.order_date}</Td>
                <Td>{customerName(o.customer_id)}</Td>
                <Td mono>{money(o.total)}</Td>
                <Td>
                  <Select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} style={{ width: 120 }}>
                    <option>Open</option><option>Fulfilled</option><option>Invoiced</option><option>Paid</option>
                  </Select>
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn small kind="ghost" onClick={() => openInvoice(o)} disabled={loadingInvoice}><FileText size={12} /> Invoice</Btn>
                    {canEditOrder && <Btn small kind="ghost" onClick={() => openEditOrder(o)}><Pencil size={12} /> Reconcile</Btn>}
                    {canDelete && <Btn small kind="danger" onClick={() => removeOrder(o.id)}><Trash2 size={12} /></Btn>}
                  </div>
                </Td>
              </tr>
            ))}
            {orders.length === 0 && <tr><Td style={{ color: COLORS.textMuted }}>No orders logged yet.</Td></tr>}
          </tbody>
        </table>
      </Card>

      {invoiceOrder && (
        <Invoice
          order={invoiceOrder}
          customer={customers.find((c) => c.id === invoiceOrder.customer_id)}
          balanceDue={orders
            .filter((o) => o.customer_id === invoiceOrder.customer_id && o.status !== "Paid")
            .reduce((sum, o) => sum + Number(o.total), 0)}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
