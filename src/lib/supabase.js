import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const SUPABASE_URL = env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || "";
const SESSION_TABLE = env.VITE_SUPABASE_SESSION_TABLE || "session_state";

/** Row id in session_state; set via configureSessionChannel (per tab / per phone pairing). */
let channelSessionId = env.VITE_SUPABASE_SESSION_ID || "";

export function configureSessionChannel(sessionId) {
  if (!sessionId || typeof sessionId !== "string") {
    throw new Error("configureSessionChannel: sessionId must be a non-empty string");
  }
  channelSessionId = sessionId;
}

export function getSessionChannelId() {
  return channelSessionId;
}

/** Call on controller page when ?session= is missing so env defaults cannot pair to the wrong row. */
export function clearSessionChannel() {
  channelSessionId = "";
}

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
  const id = getSessionChannelId();
  if (!id) {
    throw new Error("No session channel configured. Open train/sandbox first, or use controller?session=<uuid>.");
  }
  const supabase = getClient();
  const now = new Date().toISOString();
  const payload = {
    id,
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
    const sid = getSessionChannelId();
    if (!sid) return;
    const { data, error } = await supabase
      .from(SESSION_TABLE)
      .select("signal, sensor_data")
      .eq("id", sid)
      .maybeSingle();

    if (disposed || error || !data) return;
    callback(snapshotForValue(valueForPath(data, refObj.path)));
  };

  void emitCurrentValue();

  const sid = getSessionChannelId();
  if (!sid) {
    return () => {};
  }
  const channel = supabase
    .channel(`session-${sid}-${refObj.path}-${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: SESSION_TABLE,
        filter: `id=eq.${sid}`,
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
