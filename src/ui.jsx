import React from "react";

export const COLORS = {
  bg: "#17191c",
  panel: "#1f2226",
  panelAlt: "#25292e",
  border: "#33383e",
  steel: "#3a4048",
  amber: "#f0a202",
  amberDim: "#8a6317",
  text: "#e9e7e1",
  textMuted: "#9aa0a6",
  green: "#4c9a63",
  red: "#d6564f",
};

export const money = (n) =>
  (isNaN(n) ? 0 : Number(n)).toLocaleString(undefined, { style: "currency", currency: "USD" });

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_LABELS = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

export function Card({ children, style }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 6, ...style }}>
      {children}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, tone }) {
  const toneColor = tone === "danger" ? COLORS.red : tone === "good" ? COLORS.green : COLORS.amber;
  return (
    <Card style={{ padding: "16px 18px", flex: "1 1 180px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: toneColor }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Inter, sans-serif" }}>
        <Icon size={14} color={toneColor} />
        {label}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, fontWeight: 600, marginTop: 6, color: COLORS.text }}>
        {value}
      </div>
    </Card>
  );
}

export function Btn({ children, onClick, kind = "default", type = "button", small, disabled, title }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: small ? "5px 9px" : "8px 14px", borderRadius: 4,
    fontFamily: "Inter, sans-serif", fontSize: small ? 12 : 13, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", border: "1px solid transparent",
    opacity: disabled ? 0.5 : 1,
  };
  const styles = {
    default: { background: COLORS.steel, color: COLORS.text, border: `1px solid ${COLORS.border}` },
    primary: { background: COLORS.amber, color: "#1a1300" },
    ghost: { background: "transparent", color: COLORS.textMuted, border: `1px solid ${COLORS.border}` },
    danger: { background: "transparent", color: COLORS.red, border: `1px solid ${COLORS.red}55` },
  };
  return (
    <button type={type} title={title} disabled={disabled} onClick={onClick} style={{ ...base, ...styles[kind] }}>
      {children}
    </button>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      style={{
        background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4,
        padding: "7px 9px", color: COLORS.text, fontFamily: "Inter, sans-serif", fontSize: 13,
        outline: "none", width: "100%", boxSizing: "border-box", ...(props.style || {}),
      }}
    />
  );
}

export function Select(props) {
  return (
    <select
      {...props}
      style={{
        background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`, borderRadius: 4,
        padding: "7px 9px", color: COLORS.text, fontFamily: "Inter, sans-serif", fontSize: 13,
        outline: "none", width: "100%", boxSizing: "border-box", ...(props.style || {}),
      }}
    >
      {props.children}
    </select>
  );
}

export function Th({ children }) {
  return (
    <th style={{
      textAlign: "left", padding: "8px 10px", fontFamily: "Inter, sans-serif", fontSize: 11,
      textTransform: "uppercase", letterSpacing: "0.06em", color: COLORS.textMuted,
      borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap",
    }}>
      {children}
    </th>
  );
}

export function Td({ children, mono, style }) {
  return (
    <td style={{
      padding: "9px 10px", borderBottom: `1px solid ${COLORS.border}66`,
      fontFamily: mono ? "'IBM Plex Mono', monospace" : "Inter, sans-serif",
      fontSize: 13, color: COLORS.text, verticalAlign: "middle", ...style,
    }}>
      {children}
    </td>
  );
}

export function PartTag({ children }) {
  return (
    <span style={{
      display: "inline-block", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600,
      color: COLORS.amber, background: "#2a2210", border: `1px solid ${COLORS.amberDim}`,
      borderRadius: "2px 6px 2px 6px", padding: "2px 7px",
    }}>
      {children}
    </span>
  );
}

export function SectionHeader({ icon: Icon, title, subtitle, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon size={20} color={COLORS.amber} />
          <h2 style={{ fontFamily: "Oswald, sans-serif", fontWeight: 600, fontSize: 24, letterSpacing: "0.02em", margin: 0, color: COLORS.text, textTransform: "uppercase" }}>
            {title}
          </h2>
        </div>
        {subtitle && <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, color: COLORS.textMuted, marginTop: 3 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function Field({ label, children, wide }) {
  return (
    <div style={{ gridColumn: wide ? "span 2" : "span 1" }}>
      <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      {children}
    </div>
  );
}
