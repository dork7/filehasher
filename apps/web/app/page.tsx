"use client";

import { useCallback, useState } from "react";

type Tab = "encrypt" | "decrypt";

export default function Home() {
  const [tab, setTab] = useState<Tab>("encrypt");
  const [plainText, setPlainText] = useState("");
  const [encPassword, setEncPassword] = useState("");
  const [decPassword, setDecPassword] = useState("");
  const [decFile, setDecFile] = useState<File | null>(null);
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const downloadEncrypted = useCallback(async () => {
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plainText, password: encPassword }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j.error === "string" ? j.error : "Request failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "encrypted.fhc";
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: "ok", text: "Download started." });
    } catch (e) {
      setMessage({
        type: "err",
        text: e instanceof Error ? e.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }, [plainText, encPassword]);

  const runDecrypt = useCallback(async () => {
    setMessage(null);
    setDecrypted(null);
    if (!decFile) {
      setMessage({ type: "err", text: "Choose an encrypted file first." });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("file", decFile);
      fd.set("password", decPassword);
      const res = await fetch("/api/decrypt", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) {
        throw new Error(typeof j.error === "string" ? j.error : "Decryption failed.");
      }
      setDecrypted(typeof j.text === "string" ? j.text : "");
      setMessage({ type: "ok", text: "Decrypted successfully." });
    } catch (e) {
      setMessage({
        type: "err",
        text: e instanceof Error ? e.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }, [decFile, decPassword]);

  return (
    <main>
      <h1>Filehasher</h1>
      <p className="lead">
        Protect text with a password and download an encrypted file. The same password recovers
        the original content (this is encryption, not one-way hashing).
      </p>

      <div className="tabs" role="tablist" aria-label="Mode">
        <button
          type="button"
          className="tab"
          data-active={tab === "encrypt"}
          role="tab"
          aria-selected={tab === "encrypt"}
          onClick={() => setTab("encrypt")}
        >
          Encrypt text
        </button>
        <button
          type="button"
          className="tab"
          data-active={tab === "decrypt"}
          role="tab"
          aria-selected={tab === "decrypt"}
          onClick={() => setTab("decrypt")}
        >
          Decrypt file
        </button>
      </div>

      {tab === "encrypt" && (
        <div className="panel" role="tabpanel">
          <div className="field">
            <label htmlFor="text">Text to protect</label>
            <textarea
              id="text"
              value={plainText}
              onChange={(e) => setPlainText(e.target.value)}
              placeholder="Paste any text…"
              autoComplete="off"
            />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="enc-pw">Password</label>
              <input
                id="enc-pw"
                type="password"
                value={encPassword}
                onChange={(e) => setEncPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <button
              type="button"
              className="primary"
              onClick={downloadEncrypted}
              disabled={loading || !encPassword}
            >
              {loading ? "Working…" : "Download encrypted file"}
            </button>
          </div>
        </div>
      )}

      {tab === "decrypt" && (
        <div className="panel" role="tabpanel">
          <div className="field">
            <label htmlFor="file">Encrypted file (.fhc)</label>
            <input
              id="file"
              type="file"
              accept=".fhc,application/octet-stream"
              onChange={(e) => setDecFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="row">
            <div className="field">
              <label htmlFor="dec-pw">Password</label>
              <input
                id="dec-pw"
                type="password"
                value={decPassword}
                onChange={(e) => setDecPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <button
              type="button"
              className="primary"
              onClick={runDecrypt}
              disabled={loading || !decPassword}
            >
              {loading ? "Working…" : "Decrypt"}
            </button>
          </div>
          {decrypted !== null && (
            <div className="field" style={{ marginTop: "1rem", marginBottom: 0 }}>
              <label htmlFor="out">Decrypted text</label>
              <textarea id="out" readOnly value={decrypted} />
            </div>
          )}
        </div>
      )}

      {message && (
        <p className={message.type === "ok" ? "success" : "error"}>{message.text}</p>
      )}

      <p className="note">
        CLI (same format): <code>filehasher encrypt -i plain.txt -o out.fhc</code> and{" "}
        <code>filehasher decrypt -i out.fhc -o plain.txt</code>. Use{" "}
        <code>-p &quot;your password&quot;</code> or omit <code>-p</code> to be prompted.
      </p>
    </main>
  );
}
