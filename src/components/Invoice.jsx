import React from "react";
import { X, Printer } from "lucide-react";
import { COLORS, Btn, money } from "../ui";

const BUSINESS = {
  name: "KZMALL AUTO PARTS",
  slogan: "The Best Quality Products.",
  address: "Phum Takong, Sangkat Sambour, Krong Siem Reap, Siem Reap Province",
  phone: "010 939 699 / 061 222 610 / 086 206 061",
  email: "kzmal25@gmail.com",
};

export default function Invoice({ order, customer, balanceDue, onClose }) {
  function handlePrint() {
    window.print();
  }

  return (
    <div style={overlayStyle} className="invoice-overlay">
      <div style={modalStyle} className="invoice-modal">
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 10 }} className="invoice-no-print">
          <Btn kind="primary" onClick={handlePrint}><Printer size={14} /> Print / Save PDF</Btn>
          <Btn kind="ghost" onClick={onClose}><X size={14} /> Close</Btn>
        </div>

        <div style={paperStyle} id="invoice-paper">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <img src="/logo.jpg" alt="logo" style={{ width: 100, height: 100, objectFit: "contain" }} />
              <div>
                <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 20, fontWeight: 700, color: "#111", letterSpacing: "0.02em" }}>
                  {BUSINESS.name}
                </div>
                <div style={{ fontSize: 11, fontStyle: "italic", color: "#a00", fontWeight: 600, marginTop: 1 }}>
                  {BUSINESS.slogan}
                </div>
                <div style={{ fontSize: 11.5, color: "#555", marginTop: 3, maxWidth: 260, lineHeight: 1.5 }}>
                  {BUSINESS.address}<br />
                  {BUSINESS.phone}<br />
                  {BUSINESS.email}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 26, fontWeight: 700, color: "#111", letterSpacing: "0.05em" }}>
                INVOICE
              </div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                Invoice #: <b>{order.id.slice(0, 8).toUpperCase()}</b>
              </div>
              <div style={{ fontSize: 12, color: "#555" }}>Date: <b>{order.order_date}</b></div>
              <div style={{ fontSize: 12, color: "#555" }}>Status: <b>{order.status}</b></div>
            </div>
          </div>

          <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #ddd" }}>
            <div style={{ fontSize: 10.5, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Billed To</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#111" }}>{customer?.name || "—"}</div>
            {customer?.contact && <div style={{ fontSize: 12.5, color: "#555" }}>{customer.contact}</div>}
            {customer?.phone && <div style={{ fontSize: 12.5, color: "#555" }}>{customer.phone}</div>}
            {customer?.address && <div style={{ fontSize: 12.5, color: "#555" }}>{customer.address}</div>}
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #111" }}>
                <th style={thStyle}>Part #</th>
                <th style={thStyle}>Description</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Qty</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Unit Price</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((l, idx) => {
                const hasDiscount = l.original_price > l.price;
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={tdStyle}>{l.part_no}</td>
                    <td style={tdStyle}>
                      {l.name}
                      {hasDiscount && (
                        <div style={{ fontSize: 10.5, color: "#a00" }}>
                          {l.discount_type === "percent" ? `${l.discount_value}% off` : `${money(l.discount_value)} off`}
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{l.qty}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {hasDiscount && <div style={{ textDecoration: "line-through", color: "#999", fontSize: 11 }}>{money(l.original_price)}</div>}
                      {money(l.price)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{money(l.qty * l.price)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: 240 }}>
              {(() => {
                const totalDiscount = (order.items || []).reduce((s, l) => s + (Number(l.original_price || l.price) - l.price) * l.qty, 0);
                return totalDiscount > 0 ? (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#a00", padding: "3px 0" }}>
                    <span>Total Savings</span><span>-{money(totalDiscount)}</span>
                  </div>
                ) : null;
              })()}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, paddingTop: 8, borderTop: "2px solid #111", color: "#111" }}>
                <span>Total (this invoice)</span>
                <span>{money(order.total)}</span>
              </div>
              {typeof balanceDue === "number" && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginTop: 8, color: "#a00", fontWeight: 600 }}>
                  <span>Total Account Balance Due</span>
                  <span>{money(balanceDue)}</span>
                </div>
              )}
            </div>
          </div>

          {order.status !== "Paid" && (
            <div style={{ marginTop: 44 }}>
              <div style={{
                fontSize: 10.5, color: "#a00", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.05em", marginBottom: 24, textAlign: "center",
              }}>
                Sold on Credit — Signatures Required
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
                {[
                  { label: "Customer Signature", name: customer?.name },
                  { label: "Sales Signature", name: order.created_by_name || order.created_by_email },
                  { label: "Authorized By" },
                ].map((sig, idx) => (
                  <div key={idx} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ borderBottom: "1px solid #333", height: 44 }} />
                    <div style={{ fontSize: 11, color: "#333", fontWeight: 600, marginTop: 6 }}>{sig.label}</div>
                    {sig.name && <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{sig.name}</div>}
                    <div style={{ fontSize: 9.5, color: "#aaa", marginTop: 8 }}>Date: ______________</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 40, paddingTop: 14, borderTop: "1px solid #ddd", fontSize: 11, color: "#888", textAlign: "center" }}>
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

const thStyle = { textAlign: "left", padding: "8px 6px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "#333" };
const tdStyle = { padding: "8px 6px", fontSize: 12.5, color: "#222" };

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
  display: "flex", alignItems: "flex-start", justifyContent: "center",
  padding: "30px 16px", zIndex: 1000, overflowY: "auto",
};
const modalStyle = { width: "100%", maxWidth: 720 };
const paperStyle = {
  background: "#fff", borderRadius: 6, padding: "36px 40px",
  fontFamily: "Inter, sans-serif", boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
};
