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

export default function Receipt({ entry, customer, receivedBy, onClose }) {
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
                Receipt #: <b>{entry.id.slice(0, 8).toUpperCase()}</b>
              </div>
              <div style={{ fontSize: 12, color: "#555" }}>Date: <b>{entry.entry_date}</b></div>
            </div>
          </div>

          <div style={{ marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #ddd" }}>
            <div style={{ fontSize: 10.5, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Received From</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#111" }}>{customer?.name || "—"}</div>
            {customer?.contact && <div style={{ fontSize: 12.5, color: "#555" }}>{customer.contact}</div>}
            {customer?.phone && <div style={{ fontSize: 12.5, color: "#555" }}>{customer.phone}</div>}
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#f6f6f6", borderRadius: 6, padding: "18px 20px", marginBottom: 20,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em" }}>Amount Received</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#111", fontFamily: "monospace" }}>{money(entry.amount)}</div>
            </div>
            {entry.category && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em" }}>For</div>
                <div style={{ fontSize: 14, color: "#333" }}>{entry.category}</div>
              </div>
            )}
          </div>

          {entry.note && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10.5, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Note</div>
              <div style={{ fontSize: 13, color: "#333" }}>{entry.note}</div>
            </div>
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
