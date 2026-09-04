import React, { useState, useEffect, useCallback } from "react";
import { Wrench, LogOut, ShoppingCart, Package, ClipboardList, Search, Plus, Trash2, Check, FileText, KeyRound, X } from "lucide-react";
import { supabase } from "./supabaseClient";
import { COLORS, Card, StatCard, Btn, Input, Th, Td, PartTag, money } from "./ui";
import Invoice from "./components/Invoice";

export default function CustomerPortal({ session }) {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("shop");
  const [customer, setCustomer] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]); // [{ part, qty }]
  const [query, setQuery] = useState("");
  const [placing, setPlacing] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [viewImage, setViewImage] = useState(null); // { url, name }
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function changePassword() {
    setPasswordError("");
    setPasswordSuccess(false);
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setPasswordSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
  }

  const refresh = useCallback(async () => {
    // Look up exactly which customer this login belongs to first — never assume
    // "the first row the database happens to allow" is the right one.
    const { data: myLink } = await supabase
      .from("customer_profiles")
      .select("customer_id")
      .eq("id", session.user.id)
      .single();

    if (!myLink?.customer_id) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    const [{ data: cust }, { data: cat }, { data: ord }] = await Promise.all([
      supabase.from("customers").select("*").eq("id", myLink.customer_id).single(),
      supabase.rpc("storefront_catalog"),
      supabase.from("orders").select("*").eq("customer_id", myLink.customer_id).order("order_date", { ascending: false }),
    ]);
    setCustomer(cust || null);
    setCatalog(cat || []);
    setOrders(ord || []);
    setLoading(false);
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);

  function addToCart(part) {
    setCart((c) => {
      const existing = c.find((l) => l.part.id === part.id);
      if (existing) return c.map((l) => (l.part.id === part.id ? { ...l, qty: l.qty + 1 } : l));
      return [...c, { part, qty: 1 }];
    });
  }
  function setQty(partId, qty) {
    setCart((c) => c.map((l) => (l.part.id === partId ? { ...l, qty: Math.max(1, Number(qty) || 1) } : l)));
  }
  function removeFromCart(partId) {
    setCart((c) => c.filter((l) => l.part.id !== partId));
  }
  const cartTotal = cart.reduce((s, l) => s + l.part.price * l.qty, 0);

  const [promoInput, setPromoInput] = useState("");
  const [promoResult, setPromoResult] = useState(null); // { valid, discount_amount, message }
  const [checkingPromo, setCheckingPromo] = useState(false);

  async function applyPromo() {
    if (!promoInput.trim()) return;
    setCheckingPromo(true);
    const { data, error } = await supabase.rpc("preview_promo_code", { p_code: promoInput.trim(), p_subtotal: cartTotal });
    setCheckingPromo(false);
    const result = data?.[0];
    if (error || !result) {
      setPromoResult({ valid: false, discount_amount: 0, message: "Couldn't check that code." });
      return;
    }
    setPromoResult(result);
  }

  const promoDiscount = promoResult?.valid ? Number(promoResult.discount_amount) : 0;
  const finalTotal = Math.max(0, cartTotal - promoDiscount);

  async function submitOrder() {
    if (cart.length === 0) return;
    setPlacing(true);
    const items = cart.map((l) => ({ part_id: l.part.id, qty: l.qty }));
    const { error } = await supabase.rpc("place_customer_order", {
      items,
      p_promo_code: promoResult?.valid ? promoInput.trim() : null,
    });
    setPlacing(false);
    if (error) {
      alert("Couldn't place order: " + error.message);
      return;
    }
    setCart([]);
    setPromoInput("");
    setPromoResult(null);
    setTab("orders");
    refresh();
  }

  async function openInvoice(order) {
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    setInvoiceOrder({ ...order, items: data || [] });
  }

  const filteredCatalog = catalog.filter((p) => {
    const q = query.toLowerCase();
    return !q || p.part_no.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q);
  });

  const balanceDue = orders.filter((o) => o.status !== "Paid").reduce((s, o) => s + Number(o.total), 0);

  if (loading) {
    return <Centered>Loading catalog…</Centered>;
  }

  if (!customer) {
    return (
      <Centered>
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 10 }}>Your account isn't linked to a customer record yet.</div>
          <div style={{ fontSize: 12.5, color: COLORS.textMuted, marginBottom: 16 }}>Contact KZMALL AUTO PARTS to finish setting up your access.</div>
          <Btn kind="ghost" onClick={() => supabase.auth.signOut()}><LogOut size={13} /> Sign Out</Btn>
        </div>
      </Centered>
    );
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", background: COLORS.panel, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 6, background: COLORS.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wrench size={18} color="#1a1300" />
          </div>
          <div>
            <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 19, fontWeight: 600, color: COLORS.text, letterSpacing: "0.03em", textTransform: "uppercase", lineHeight: 1 }}>
              KZMALL AUTO PARTS
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Ordering — {customer.name}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setTab("shop")} style={navBtnStyle(tab === "shop")}><Package size={14} /> Shop</button>
          <button onClick={() => setTab("cart")} style={navBtnStyle(tab === "cart")}><ShoppingCart size={14} /> Cart {cart.length > 0 && `(${cart.length})`}</button>
          <button onClick={() => setTab("orders")} style={navBtnStyle(tab === "orders")}><ClipboardList size={14} /> My Orders</button>
          <button onClick={() => { setShowPasswordForm(true); setPasswordError(""); setPasswordSuccess(false); }} style={{ ...navBtnStyle(false), border: `1px solid ${COLORS.border}` }}><KeyRound size={13} /></button>
          <button onClick={() => supabase.auth.signOut()} style={{ ...navBtnStyle(false), border: `1px solid ${COLORS.border}` }}><LogOut size={13} /></button>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
        {balanceDue > 0 && (
          <Card style={{ padding: 16, marginBottom: 18, borderLeft: `4px solid ${COLORS.red}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              <ClipboardList size={14} color={COLORS.red} /> Unpaid Orders
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><Th>Date</Th><Th>Order #</Th><Th>Status</Th><Th>Amount</Th><Th></Th></tr></thead>
              <tbody>
                {orders.filter((o) => o.status !== "Paid").map((o) => (
                  <tr key={o.id}>
                    <Td mono>{o.order_date}</Td>
                    <Td mono style={{ fontSize: 11.5, color: COLORS.textMuted }}>{o.id.slice(0, 8).toUpperCase()}</Td>
                    <Td>{o.status}</Td>
                    <Td mono style={{ color: COLORS.red, fontWeight: 700 }}>{money(o.total)}</Td>
                    <Td><Btn small kind="ghost" onClick={() => openInvoice(o)}><FileText size={12} /> Invoice</Btn></Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ padding: "10px 10px 4px", textAlign: "right", fontSize: 13, fontWeight: 700, color: COLORS.text, borderTop: `1px solid ${COLORS.border}` }}>Total Owed</td>
                  <td style={{ padding: "10px 10px 4px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: COLORS.red, borderTop: `1px solid ${COLORS.border}` }}>{money(balanceDue)}</td>
                </tr>
              </tfoot>
            </table>
          </Card>
        )}

        {tab === "shop" && (
          <div>
            <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
              <Search size={14} color={COLORS.textMuted} style={{ position: "absolute", left: 8, top: 9 }} />
              <Input placeholder="Search parts…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 28 }} />
            </div>
            <Card style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>Photo</Th><Th>Part #</Th><Th>Name</Th><Th>Brand</Th><Th>Price</Th><Th></Th></tr></thead>
                <tbody>
                  {filteredCatalog.map((p) => (
                    <tr key={p.id}>
                      <Td>
                        {p.image_url ? (
                          <img
                            src={p.image_url} alt=""
                            onClick={() => setViewImage({ url: p.image_url, name: p.name })}
                            style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 4, border: `1px solid ${COLORS.border}`, cursor: "pointer" }}
                          />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: 4, background: COLORS.panelAlt, border: `1px solid ${COLORS.border}` }} />
                        )}
                      </Td>
                      <Td mono><PartTag>{p.part_no}</PartTag></Td>
                      <Td>{p.name}</Td>
                      <Td style={{ color: COLORS.textMuted }}>{p.brand}</Td>
                      <Td mono>{money(p.price)}</Td>
                      <Td>
                        <Btn small kind="primary" disabled={p.qty <= 0} onClick={() => addToCart(p)}>
                          <Plus size={12} /> {p.qty <= 0 ? "Out of stock" : "Add"}
                        </Btn>
                      </Td>
                    </tr>
                  ))}
                  {filteredCatalog.length === 0 && <tr><Td style={{ color: COLORS.textMuted }}>No parts match "{query}".</Td></tr>}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {tab === "cart" && (
          <div>
            <Card style={{ overflow: "auto", marginBottom: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><Th>Photo</Th><Th>Part</Th><Th>Qty</Th><Th>Price</Th><Th>Subtotal</Th><Th></Th></tr></thead>
                <tbody>
                  {cart.map((l) => (
                    <tr key={l.part.id}>
                      <Td>
                        {l.part.image_url ? (
                          <img
                            src={l.part.image_url} alt=""
                            onClick={() => setViewImage({ url: l.part.image_url, name: l.part.name })}
                            style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, border: `1px solid ${COLORS.border}`, cursor: "pointer" }}
                          />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 4, background: COLORS.panelAlt, border: `1px solid ${COLORS.border}` }} />
                        )}
                      </Td>
                      <Td mono><PartTag>{l.part.part_no}</PartTag> {l.part.name}</Td>
                      <Td><Input type="number" min="1" max={l.part.qty} value={l.qty} onChange={(e) => setQty(l.part.id, e.target.value)} style={{ width: 70 }} /></Td>
                      <Td mono>{money(l.part.price)}</Td>
                      <Td mono>{money(l.part.price * l.qty)}</Td>
                      <Td><Btn small kind="danger" onClick={() => removeFromCart(l.part.id)}><Trash2 size={12} /></Btn></Td>
                    </tr>
                  ))}
                  {cart.length === 0 && <tr><Td style={{ color: COLORS.textMuted }}>Your cart is empty. Go to Shop to add parts.</Td></tr>}
                </tbody>
              </table>
            </Card>
            {cart.length > 0 && (
              <>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: "0 1 200px" }}>
                    <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Promo Code</div>
                    <Input value={promoInput} onChange={(e) => { setPromoInput(e.target.value); setPromoResult(null); }} placeholder="Enter code" />
                  </div>
                  <Btn kind="ghost" disabled={checkingPromo || !promoInput.trim()} onClick={applyPromo}>{checkingPromo ? "Checking…" : "Apply"}</Btn>
                  {promoResult && (
                    <div style={{ fontSize: 12.5, color: promoResult.valid ? COLORS.green : COLORS.red, alignSelf: "center" }}>
                      {promoResult.message}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    {promoDiscount > 0 && (
                      <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 2 }}>
                        Subtotal: {money(cartTotal)} &nbsp;·&nbsp; <span style={{ color: COLORS.green }}>-{money(promoDiscount)}</span>
                      </div>
                    )}
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, color: COLORS.amber, fontWeight: 700 }}>Total: {money(finalTotal)}</div>
                  </div>
                  <Btn kind="primary" disabled={placing} onClick={submitOrder}><Check size={14} /> Place Order</Btn>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "orders" && (
          <Card style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><Th>Date</Th><Th>Total</Th><Th>Status</Th><Th></Th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <Td mono>{o.order_date}</Td>
                    <Td mono>{money(o.total)}</Td>
                    <Td>{o.status}</Td>
                    <Td><Btn small kind="ghost" onClick={() => openInvoice(o)}><FileText size={12} /> Invoice</Btn></Td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><Td style={{ color: COLORS.textMuted }}>You haven't placed any orders yet.</Td></tr>}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {invoiceOrder && (
        <Invoice order={invoiceOrder} customer={customer} balanceDue={balanceDue} onClose={() => setInvoiceOrder(null)} />
      )}

      {viewImage && (
        <div
          onClick={() => setViewImage(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: 24, cursor: "pointer",
          }}
        >
          <img src={viewImage.url} alt={viewImage.name} style={{ maxWidth: "90%", maxHeight: "80%", borderRadius: 8, boxShadow: "0 10px 40px rgba(0,0,0,0.6)" }} />
          <div style={{ color: COLORS.text, fontSize: 14, fontWeight: 600, marginTop: 14 }}>{viewImage.name}</div>
          <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 6 }}>Tap anywhere to close</div>
        </div>
      )}
      {showPasswordForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <Card style={{ padding: 24, width: 320 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 16, textTransform: "uppercase", letterSpacing: "0.03em", color: COLORS.text }}>
                Change Password
              </div>
              <button onClick={() => setShowPasswordForm(false)} style={{ background: "transparent", border: "none", color: COLORS.textMuted, cursor: "pointer" }}><X size={16} /></button>
            </div>
            {passwordSuccess ? (
              <div style={{ color: COLORS.green, fontSize: 13, marginBottom: 12 }}>Password updated. Use it next time you log in.</div>
            ) : (
              <>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, textTransform: "uppercase" }}>New Password</div>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Confirm Password</div>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Type it again" />
                </div>
                {passwordError && <div style={{ color: COLORS.red, fontSize: 12.5, marginBottom: 10 }}>{passwordError}</div>}
                <Btn kind="primary" disabled={savingPassword} onClick={changePassword} style={{ width: "100%" }}>
                  {savingPassword ? "Saving…" : "Update Password"}
                </Btn>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function navBtnStyle(active) {
  return {
    display: "inline-flex", alignItems: "center", gap: 6, background: active ? COLORS.amber : "transparent",
    color: active ? "#1a1300" : COLORS.textMuted, border: "none", borderRadius: 4, padding: "7px 12px",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  };
}

function Centered({ children }) {
  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, fontFamily: "Inter, sans-serif" }}>
      {children}
    </div>
  );
}
