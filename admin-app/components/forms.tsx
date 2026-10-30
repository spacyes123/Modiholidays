"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "@/lib/actions";
export type FieldSpec = {
  key: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
};
export function Fields({
  spec,
  data,
  onChange,
}: {
  spec: FieldSpec[];
  data: Record<string, unknown>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="form-grid">
      {spec.map((f) => (
        <label key={f.key} className={f.type === "textarea" ? "wide" : ""}>
          {f.label}
          {f.required ? " *" : ""}
          {f.options ? (
            <select
              value={String(data[f.key] ?? "")}
              onChange={(e) => onChange(f.key, e.target.value)}
              required={f.required}
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              value={String(data[f.key] ?? "")}
              onChange={(e) => onChange(f.key, e.target.value)}
              maxLength={12000}
            />
          ) : (
            <input
              type={f.type || "text"}
              value={String(data[f.key] ?? "")}
              onChange={(e) => onChange(f.key, e.target.value)}
              required={f.required}
              step={f.type === "number" ? "any" : undefined}
              min={f.type === "number" ? "0" : undefined}
              maxLength={f.type === "number" ? undefined : 240}
            />
          )}
        </label>
      ))}
    </div>
  );
}
export function SaveForm({
  operation,
  id,
  initial,
  spec,
  after,
  extra = {},
}: {
  operation: string;
  id?: string;
  initial: Record<string, unknown>;
  spec: FieldSpec[];
  after?: string;
  extra?: Record<string, unknown>;
}) {
  const [data, setData] = useState(initial),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setStatus("Saving…");
        const payload = { ...data };
        if (operation === "enquiry") {
          payload.children_ages = String(payload.children_ages || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
            .map(Number);
        }
        const result = await mutate(operation, {
          ...payload,
          id: id || null,
          data: payload,
          ...extra,
        });
        setBusy(false);
        setStatus(result.error || result.message || "Saved");
        if (!result.error) {
          if (after) router.push(after.replace(":id", result.id || id || ""));
          router.refresh();
        }
      }}
    >
      <Fields
        spec={spec}
        data={data}
        onChange={(key, value) => setData({ ...data, [key]: value })}
      />
      <div className="form-actions">
        <button disabled={busy} type="submit">
          {busy
            ? "Saving…"
            : operation === "booking"
              ? "Convert to booking"
              : operation === "payment"
                ? "Record received payment"
                : "Save to database"}
        </button>
        <p role="status">{status}</p>
      </div>
    </form>
  );
}
export function OperationButton({
  label,
  operation,
  input,
  confirm,
  after,
}: {
  label: string;
  operation: string;
  input: Record<string, unknown>;
  confirm?: string;
  after?: string;
}) {
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <div className="operation">
      <button
        disabled={busy}
        onClick={async () => {
          if (confirm && !window.confirm(confirm)) return;
          setBusy(true);
          const result = await mutate(operation, input);
          setBusy(false);
          setStatus(result.error || result.message || "Saved");
          if (!result.error) {
            if (after) router.push(after.replace(":id", result.id || ""));
            router.refresh();
          }
        }}
      >
        {label}
      </button>
      <span role="status">{status}</span>
    </div>
  );
}
export function ActivityForm({ enquiryId }: { enquiryId: string }) {
  const [body, setBody] = useState(""),
    [kind, setKind] = useState("Note"),
    [status, setStatus] = useState("");
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await mutate("activity", {
          enquiry_id: enquiryId,
          kind,
          body,
        });
        setStatus(r.error || "Activity recorded.");
        if (!r.error) {
          setBody("");
          router.refresh();
        }
      }}
    >
      <label>
        Communication type
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          {["Call", "WhatsApp", "Email", "Follow-up", "Note"].map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      <label>
        What happened?
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={6000}
        />
      </label>
      <button>Record communication</button>
      <p role="status">{status}</p>
    </form>
  );
}
export function SettingsForm({
  margin,
  email,
}: {
  margin: string;
  email: string;
}) {
  const [m, setM] = useState(margin),
    [e, setE] = useState(email),
    [status, setStatus] = useState("");
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const r = await mutate("settings", { margin: m, email: e });
        setStatus(r.error || "Settings saved.");
      }}
    >
      <label>
        Minimum gross margin %
        <input
          value={m}
          onChange={(e) => setM(e.target.value)}
          type="number"
          min="0"
          max="99.99"
          step=".01"
          required
        />
      </label>
      <label>
        Verified quotation contact email
        <input
          type="email"
          value={e}
          onChange={(event) => setE(event.target.value)}
        />
      </label>
      <p>
        GST and TCS are entered per quotation with a mandatory
        transaction-specific explanation. No universal tax rate is applied.
      </p>
      <button>Save admin settings</button>
      <p role="status">{status}</p>
    </form>
  );
}
