const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const SESSION_TABLE = process.env.VITE_SUPABASE_SESSION_TABLE || "session_state";
const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const describeSupabase = hasSupabaseConfig ? describe : describe.skip;

describeSupabase("supabase live integration", () => {
  it("writes and reads a real session_state row", async () => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const id = `jest-live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = {
      id,
      signal: "start",
      sensor_data: {
        acceleration: { x: 0.12, y: -0.08, z: 0.3 },
        timestamp: Date.now(),
      },
      updated_at: new Date().toISOString(),
    };

    const write = await client.from(SESSION_TABLE).upsert(payload, { onConflict: "id" });
    expect(write.error).toBeNull();

    const read = await client
      .from(SESSION_TABLE)
      .select("id, signal, sensor_data")
      .eq("id", id)
      .maybeSingle();

    expect(read.error).toBeNull();
    expect(read.data).toEqual(
      expect.objectContaining({
        id,
        signal: "start",
      })
    );
    expect(read.data.sensor_data).toEqual(
      expect.objectContaining({
        acceleration: expect.objectContaining({ x: 0.12, y: -0.08, z: 0.3 }),
      })
    );

    await client.from(SESSION_TABLE).delete().eq("id", id);
  });
});
