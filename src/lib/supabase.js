import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SESSION_ID = import.meta.env.VITE_SUPABASE_SESSION_ID || "default";
const SESSION_TABLE = import.meta.env.VITE_SUPABASE_SESSION_TABLE || "session_state";

let supabaseClient = null;

function getClient() {
  if (!SUPABASE_URL) {
    throw new Error("VITE_SUPABASE_URL is not set in environment variables");
  }
  if (!SUPABASE_ANON_KEY) {
    throw new Error("VITE_SUPABASE_ANON_KEY is not set in environment variables");
  }
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

function createRef(path) {
  return { path };
}

function valueForPath(row, path) {
  if (!row) return null;
  if (path === "session/signal") return row.signal ?? null;
  if (path === "session/sensorData") return row.sensor_data ?? null;
  return null;
}

function snapshotForValue(value) {
  return {
    val() {
      return value;
    },
  };
}

async function set(refObj, value) {
  const supabase = getClient();
  const now = new Date().toISOString();
  const payload = {
    id: SESSION_ID,
    updated_at: now,
  };

  if (refObj?.path === "session/signal") {
    payload.signal = value;
  } else if (refObj?.path === "session/sensorData") {
    payload.sensor_data = value;
  } else {
    throw new Error(`Unsupported ref path: ${String(refObj?.path)}`);
  }

  const { error } = await supabase.from(SESSION_TABLE).upsert(payload, {
    onConflict: "id",
  });
  if (error) throw error;
}

function onValue(refObj, callback) {
  let disposed = false;
  const supabase = getClient();

  const emitCurrentValue = async () => {
    const { data, error } = await supabase
      .from(SESSION_TABLE)
      .select("signal, sensor_data")
      .eq("id", SESSION_ID)
      .maybeSingle();

    if (disposed || error || !data) return;
    callback(snapshotForValue(valueForPath(data, refObj.path)));
  };

  void emitCurrentValue();

  const channel = supabase
    .channel(`session-${SESSION_ID}-${refObj.path}-${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: SESSION_TABLE,
        filter: `id=eq.${SESSION_ID}`,
      },
      (payload) => {
        if (disposed) return;
        const row = payload.new || payload.old;
        callback(snapshotForValue(valueForPath(row, refObj.path)));
      }
    )
    .subscribe();

  return () => {
    disposed = true;
    void supabase.removeChannel(channel);
  };
}

const db = {
  get client() {
    return getClient();
  },
};
const signalRef = createRef("session/signal");
const sensorDataRef = createRef("session/sensorData");

export { db, signalRef, sensorDataRef, set, onValue };
