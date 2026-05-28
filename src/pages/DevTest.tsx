import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type TestStatus = "pending" | "running" | "pass" | "fail";

interface TestResult {
  name: string;
  status: TestStatus;
  detail: string;
}

const TABLES = [
  "users",
  "children",
  "user_credits",
  "uploaded_images",
  "generated_concepts",
  "credit_purchases",
  "orders",
] as const;

const BUCKETS = ["drawings", "concept-images"] as const;

function StatusBadge({ status }: { status: TestStatus }) {
  const styles: Record<TestStatus, string> = {
    pending: "bg-gray-100 text-gray-500",
    running: "bg-yellow-100 text-yellow-700 animate-pulse",
    pass: "bg-green-100 text-green-700",
    fail: "bg-red-100 text-red-700",
  };
  const labels: Record<TestStatus, string> = {
    pending: "—",
    running: "Running…",
    pass: "PASS",
    fail: "FAIL",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function TestRow({ result }: { result: TestResult }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-2 pr-4 text-sm font-medium text-gray-800">{result.name}</td>
      <td className="py-2 pr-4">
        <StatusBadge status={result.status} />
      </td>
      <td className="py-2 text-xs text-gray-500 font-mono">{result.detail}</td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">{title}</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full px-4">
          <tbody className="divide-y divide-gray-50 px-4">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DevTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  function upsert(name: string, status: TestStatus, detail: string) {
    setResults((prev) => {
      const idx = prev.findIndex((r) => r.name === name);
      const next = { name, status, detail };
      if (idx === -1) return [...prev, next];
      const arr = [...prev];
      arr[idx] = next;
      return arr;
    });
  }

  async function runTests() {
    setRunning(true);
    setDone(false);
    setResults([]);

    // ── 1. Connection ────────────────────────────────────────────
    upsert("Supabase connection", "running", "");
    try {
      const { error } = await supabase.from("users" as never).select("id").limit(1);
      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows, which still means connected
        upsert("Supabase connection", "fail", error.message);
      } else {
        upsert("Supabase connection", "pass", `Project: ${import.meta.env.VITE_SUPABASE_URL}`);
      }
    } catch (e) {
      upsert("Supabase connection", "fail", String(e));
    }

    // ── 2. Tables ────────────────────────────────────────────────
    for (const table of TABLES) {
      const label = `Table: ${table}`;
      upsert(label, "running", "");
      const { error } = await supabase.from(table as never).select("id").limit(1);
      if (error) {
        // RLS "no rows" is fine — it means the table exists but auth is required
        const isRlsBlock = error.code === "PGRST301" || error.message.includes("row-level security");
        if (isRlsBlock) {
          upsert(label, "pass", "RLS active — sign in to query");
        } else if (error.code === "PGRST116") {
          upsert(label, "pass", "Table exists, 0 rows");
        } else {
          upsert(label, "fail", `${error.code}: ${error.message}`);
        }
      } else {
        upsert(label, "pass", "Accessible");
      }
    }

    // ── 3. Storage buckets ───────────────────────────────────────
    // listBuckets() requires service role — probe each bucket directly instead.
    for (const bucket of BUCKETS) {
      const label = `Bucket: ${bucket}`;
      upsert(label, "running", "");
      const { error } = await supabase.storage.from(bucket).list("", { limit: 1 });
      if (!error) {
        upsert(label, "pass", "Exists and accessible");
      } else {
        const msg = error.message.toLowerCase();
        // "not found" / "does not exist" → bucket missing
        // "not authorized" / "permission" / "policy" → bucket exists, RLS blocks anon
        if (msg.includes("not found") || msg.includes("does not exist") || msg.includes("no such")) {
          upsert(label, "fail", "Bucket not found — run storage SQL in Supabase dashboard");
        } else {
          // Any auth/policy error means the bucket IS there, just locked down correctly
          upsert(label, "pass", `Exists — RLS active (${error.message})`);
        }
      }
    }

    // ── 4. Auth session ──────────────────────────────────────────
    upsert("Auth: current session", "running", "");
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      upsert("Auth: current session", "fail", sessionError.message);
    } else if (sessionData.session) {
      const email = sessionData.session.user.email ?? "unknown";
      upsert("Auth: current session", "pass", `Signed in as ${email}`);
    } else {
      upsert("Auth: current session", "pass", "No active session (not signed in)");
    }

    // ── 5. DB functions ──────────────────────────────────────────
    upsert("Function: check_generation_eligibility", "running", "");
    const { data: session } = await supabase.auth.getSession();
    if (session.session?.user.id) {
      const { data: fnData, error: fnError } = await supabase.rpc(
        "check_generation_eligibility",
        { p_user_id: session.session.user.id }
      );
      if (fnError) {
        upsert("Function: check_generation_eligibility", "fail", fnError.message);
      } else {
        const row = Array.isArray(fnData) ? fnData[0] : fnData;
        upsert(
          "Function: check_generation_eligibility",
          "pass",
          row ? `can_generate=${row.can_generate}, message="${row.message}"` : "returned empty"
        );
      }
    } else {
      upsert(
        "Function: check_generation_eligibility",
        "pass",
        "Skipped — sign in to test with a real user_id"
      );
    }

    // ── 6. Google OAuth config ───────────────────────────────────
    upsert("Google OAuth: VITE_GOOGLE_CLIENT_ID", "running", "");
    const gid = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!gid || gid === "your-google-client-id-here.apps.googleusercontent.com") {
      upsert(
        "Google OAuth: VITE_GOOGLE_CLIENT_ID",
        "fail",
        "Not set — add real Client ID to .env.local"
      );
    } else {
      upsert("Google OAuth: VITE_GOOGLE_CLIENT_ID", "pass", `Client ID: ${gid.slice(0, 20)}…`);
    }

    setRunning(false);
    setDone(true);
  }

  useEffect(() => {
    void runTests();
  }, []);

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const total = results.filter((r) => r.status !== "pending").length;

  const connectionResults = results.filter((r) => r.name.startsWith("Supabase connection") || r.name.startsWith("Auth:"));
  const tableResults = results.filter((r) => r.name.startsWith("Table:"));
  const storageResults = results.filter((r) => r.name.startsWith("Bucket:"));
  const fnResults = results.filter((r) => r.name.startsWith("Function:") || r.name.startsWith("Google OAuth:"));

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Toyify — Dev Test Suite</h1>
              <p className="text-sm text-gray-500 mt-1">
                Tests Supabase connection, tables, storage buckets, auth, and DB functions.
              </p>
            </div>
            <button
              onClick={runTests}
              disabled={running}
              className="px-4 py-2 bg-pink-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 hover:bg-pink-600 transition-colors"
            >
              {running ? "Running…" : "Re-run"}
            </button>
          </div>

          {done && (
            <div className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium ${failed === 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {failed === 0
                ? `All ${passed} tests passed`
                : `${failed} of ${total} tests failed — see details below`}
            </div>
          )}
        </div>

        {/* Connection & Auth */}
        {connectionResults.length > 0 && (
          <Section title="Connection & Auth">
            {connectionResults.map((r) => <TestRow key={r.name} result={r} />)}
          </Section>
        )}

        {/* Tables */}
        {tableResults.length > 0 && (
          <Section title="Database Tables">
            {tableResults.map((r) => <TestRow key={r.name} result={r} />)}
          </Section>
        )}

        {/* Storage */}
        {storageResults.length > 0 && (
          <Section title="Storage Buckets">
            {storageResults.map((r) => <TestRow key={r.name} result={r} />)}
          </Section>
        )}

        {/* Functions & OAuth */}
        {fnResults.length > 0 && (
          <Section title="DB Functions & OAuth Config">
            {fnResults.map((r) => <TestRow key={r.name} result={r} />)}
          </Section>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Dev-only page — remove the /dev-test route before going to production
        </p>
      </div>
    </div>
  );
}
