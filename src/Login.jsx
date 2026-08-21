import React, { useState } from "react";
import { Wrench } from "lucide-react";
import { supabase } from "./supabaseClient";
import { COLORS, Btn, Input, Card } from "./ui";

export default function Login() {
  const [identifier, setIdentifier] = useState(""); // staff email OR customer username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let email = identifier.trim();

    // If it doesn't look like an email, treat it as a customer username and
    // silently resolve the real email behind the scenes before signing in.
    if (!email.includes("@")) {
      const { data: resolvedEmail, error: lookupErr } = await supabase.rpc("lookup_customer_email", { p_username: email });
      if (lookupErr || !resolvedEmail) {
        setLoading(false);
        setError("Username not found.");
        return;
      }
      email = resolvedEmail;
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInErr) setError("Incorrect username/email or password.");
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <Card style={{ padding: 28, width: 320 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, borderRadius: 6, background: COLORS.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wrench size={18} color="#1a1300" />
          </div>
          <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, fontWeight: 600, color: COLORS.text, textTransform: "uppercase" }}>
            PSM Auto Part
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Email or Username</div>
            <Input required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Staff: email — Customers: username" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, textTransform: "uppercase" }}>Password</div>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <div style={{ color: COLORS.red, fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
          <Btn type="submit" kind="primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in…" : "Sign In"}
          </Btn>
        </form>
        <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 16, lineHeight: 1.5 }}>
          Staff: ask the owner to add you under Authentication → Users.<br />
          Customers: ask KZMALL AUTO PARTS for your username and password.
        </div>
      </Card>
    </div>
  );
}
