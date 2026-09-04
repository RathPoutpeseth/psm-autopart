import React from "react";
import { X, Printer } from "lucide-react";
import { COLORS, Btn, Select, money } from "../ui";

const BUSINESS = {
  name: "KZMALL AUTO PARTS",
  slogan: "The Best Quality Products.",
  address: "Phum Takong, Sangkat Sambour, Krong Siem Reap, Siem Reap Province",
  phone: "010 939 699 / 061 222 610 / 086 206 061",
  email: "kzmal25@gmail.com",
};

function monthLabel(monthStr) {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function Statement({ customer, month, onMonthChange, monthOptions, ordersWithItems, balanceDue, loading, onClose }) {
  const monthTotal = ordersWithItems.reduce((s, o) => s + Number(o.total), 0);

  function handlePrint() {
    window.print();
  }

  return (
    <div style={overlayStyle} className="invoice-overlay">
      <div style={modalStyle} className="invoice-modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }} className="invoice-no-print">
          <Select value={month} onChange={(e) => onMonthChange(e.target.value)} style={{ width: 180 }}>
            {monthOptions.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </Select>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn kind="primary" onClick={handlePrint}><Printer size={14} /> Print / Save PDF</Btn>
            <Btn kind="ghost" onClick={onClose}><X size={14} /> Close</Btn>
          </div>
        </div>

        <div style={paperStyle} id="invoice-paper">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <img src="/logo.jpg" alt="logo" style={{ width: 100, height: 100, objectFit: "contain" }} />
              <div>
                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 20, fontWeight: 700, color: "#111", letterSpacing: "0.02em" }}>{BUSINESS.name}</div>
                <div style={{ fontSize: 11, fontStyle: "italic", color: "#a00", fontWeight: 600, marginTop: 1 }}>{BUSINESS.slogan}</div>
                <div style={{ fontSize: 11.5, color: "#555", marginTop: 3, maxWidth: 260, lineHeight: 1.5 }}>
                  {BUSINESS.address}<br />{BUSINESS.phone}<br />{BUSINESS.email}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 24, fontWeight: 700, color: "#111", letterSpacing: "0.05em" }}>MONTHLY STATEMENT</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Period: <b>{monthLabel(month)}</b></div>
            </div>
          </div>

          <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #ddd" }}>
            <div style={{ fontSize: 10.5, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Statement For</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#111" }}>{customer?.name || "—"}</div>
            {customer?.contact && <div style={{ fontSize: 12.5, color: "#555" }}>{customer.contact}</div>}
            {customer?.phone && <div style={{ fontSize: 12.5, color: "#555" }}>{customer.phone}</div>}
            {customer?.address && <div style={{ fontSize: 12.5, color: "#555" }}>{customer.address}</div>}
          </div>

          {loading ? (
            <div style={{ padding: "30px 0", textAlign: "center", color: "#888", fontSize: 13 }}>Loading…</div>
          ) : ordersWithItems.length === 0 ? (
            <div style={{ padding: "30px 0", textAlign: "center", color: "#888", fontSize: 13 }}>No orders in {monthLabel(month)}.</div>
          ) : (
            ordersWithItems.map((o) => (
              <div key={o.id} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f6f6f6", padding: "6px 10px", borderRadius: 4, marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>
                    {o.order_date} — Order #{o.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11.5, color: o.status === "Paid" ? "#2f7d4a" : "#a00", fontWeight: 700 }}>{o.status}</div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #ccc" }}>
                      <th style={thStyle}>Part #</th><th style={thStyle}>Description</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Qty</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Unit Price</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(o.items || []).map((l, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={tdStyle}>{l.part_no}</td>
                        <td style={tdStyle}>{l.name}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>{l.qty}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>{money(l.price)}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>{money(l.qty * l.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: "right", fontSize: 12.5, fontWeight: 700, color: "#111", marginTop: 4 }}>Order Total: {money(o.total)}</div>
              </div>
            ))
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
            <div style={{ width: 260 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, paddingTop: 8, borderTop: "2px solid #111", color: "#111" }}>
                <span>Total Sold This Month</span><span>{money(monthTotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginTop: 8, color: "#a00", fontWeight: 600 }}>
                <span>Total Account Balance Due</span><span>{money(balanceDue)}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 40 }}>
            <div style={{ fontSize: 10.5, color: "#a00", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 24, textAlign: "center" }}>
              Reviewed &amp; Confirmed — Signatures
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
              {[{ label: "Customer Signature", name: customer?.name }, { label: "Authorized By" }].map((sig, idx) => (
                <div key={idx} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ borderBottom: "1px solid #333", height: 44 }} />
                  <div style={{ fontSize: 11, color: "#333", fontWeight: 600, marginTop: 6 }}>{sig.label}</div>
                  {sig.name && <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{sig.name}</div>}
                  <div style={{ fontSize: 9.5, color: "#aaa", marginTop: 8 }}>Date: ______________</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 30, paddingTop: 14, borderTop: "1px solid #ddd", fontSize: 11, color: "#888", textAlign: "center" }}>
            Thank you for your business.
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-paper, #invoice-paper * { visibility: visible; }
          #invoice-paper { position: absolute; left: 0; top: 0; width: 100%; }
          .invoice-no-print { display: none !important; }
          .invoice-overlay { position: static !important; background: none !important; }
          .invoice-modal { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

const thStyle = { textAlign: "left", padding: "6px 6px", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em", color: "#333" };
const tdStyle = { padding: "6px 6px", fontSize: 12, color: "#222" };

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
  display: "flex", alignItems: "flex-start", justifyContent: "center",
  padding: "30px 16px", zIndex: 1000, overflowY: "auto",
};
const modalStyle = { width: "100%", maxWidth: 760 };
const paperStyle = {
  background: "#fff", borderRadius: 6, padding: "36px 40px",
  fontFamily: "Inter, sans-serif", boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
};
