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

// Pull a readable item name, quantity and unit price out of an "Item Sold" entry's note,
// e.g. "Garage X — PSM-2201 General Engine Oil × 2 sold".
function describeSold(e) {
  const note = e.note || "";
  const sep = note.indexOf(" — ");
  const desc = sep >= 0 ? note.slice(sep + 3) : note;
  const m = desc.match(/×\s*(\d+)/);
  const qty = m ? Number(m[1]) : null;
  const label = desc.replace(/\s*×\s*\d+(\s*sold)?\s*$/i, "").trim() || e.category;
  return { label, qty, unit: qty ? Number(e.amount) / qty : null };
}

export default function Receipt({ entry, entries, customer, receivedBy, onClose }) {
  const list = entries && entries.length ? entries : [entry];
  const first = list[0];
  const itemized = list.every((e) => e.category === "Item Sold");
  const grandTotal = list.reduce((sum, e) => sum + Number(e.amount), 0);

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
                RECEIPT
              </div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                Receipt #: <b>{first.id.slice(0, 8).toUpperCase()}</b>
              </div>
              <div style={{ fontSize: 12, color: "#555" }}>Date: <b>{first.entry_date}</b></div>
            </div>
          </div>

          <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #ddd" }}>
            <div style={{ fontSize: 10.5, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Received From</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#111" }}>{customer?.name || "—"}</div>
            {customer?.contact && <div style={{ fontSize: 12.5, color: "#555" }}>{customer.contact}</div>}
            {customer?.phone && <div style={{ fontSize: 12.5, color: "#555" }}>{customer.phone}</div>}
          </div>

          {itemized ? (
            <>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #111" }}>
                <th style={{ textAlign: "left", padding: "8px 6px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "#333" }}>Item Sold</th>
                <th style={{ textAlign: "right", padding: "8px 6px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "#333" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "8px 6px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "#333" }}>Unit Price</th>
                <th style={{ textAlign: "right", padding: "8px 6px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "#333" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => {
                const d = describeSold(e);
                return (
                  <tr key={e.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px 6px", fontSize: 12.5, color: "#222" }}>{d.label}</td>
                    <td style={{ padding: "8px 6px", fontSize: 12.5, color: "#222", textAlign: "right" }}>{d.qty ?? "—"}</td>
                    <td style={{ padding: "8px 6px", fontSize: 12.5, color: "#222", textAlign: "right" }}>{d.unit != null ? money(d.unit) : "—"}</td>
                    <td style={{ padding: "8px 6px", fontSize: 12.5, color: "#222", textAlign: "right" }}>{money(e.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#f6f6f6", borderRadius: 6, padding: "14px 20px", marginBottom: 20,
          }}>
            <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Received</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#111", fontFamily: "monospace" }}>{money(grandTotal)}</div>
          </div>

            </>
          ) : (
            <>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#f6f6f6", borderRadius: 6, padding: "18px 20px", marginBottom: 20,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em" }}>Amount Received</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#111", fontFamily: "monospace" }}>{money(first.amount)}</div>
            </div>
            {first.category && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em" }}>For</div>
                <div style={{ fontSize: 14, color: "#333" }}>{first.category}</div>
              </div>
            )}
          </div>

          {first.note && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10.5, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Note</div>
              <div style={{ fontSize: 13, color: "#333" }}>{first.note}</div>
            </div>
          )}

            </>
          )}

          <div style={{ marginTop: 40 }}>
            <div style={{ width: 200, marginLeft: "auto" }}>
              <div style={{ borderBottom: "1px solid #333", height: 44 }} />
              <div style={{ fontSize: 11, color: "#333", fontWeight: 600, marginTop: 6, textAlign: "center" }}>Sales Signature</div>
              {receivedBy && <div style={{ fontSize: 10, color: "#888", marginTop: 2, textAlign: "center" }}>{receivedBy}</div>}
              <div style={{ fontSize: 9.5, color: "#aaa", marginTop: 8, textAlign: "center" }}>Date: ______________</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", fontSize: 12, color: "#888", marginTop: 20, paddingTop: 14, borderTop: "1px solid #ddd" }}>
            <span>Thank you for your payment.</span>
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

const overlayStyle = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
  display: "flex", alignItems: "flex-start", justifyContent: "center",
  padding: "30px 16px", zIndex: 1000, overflowY: "auto",
};
const modalStyle = { width: "100%", maxWidth: 620 };
const paperStyle = {
  background: "#fff", borderRadius: 6, padding: "36px 40px",
  fontFamily: "Inter, sans-serif", boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
};
