export function createPostgresStore(db) {
  async function lookup(id) {
    const rows = await db.sql`SELECT prize FROM spin_tickets WHERE participant = ${id}::uuid`;
    return rows[0]?.prize ?? null;
  }
  return {
    lookup,
    async allocate(id) {
      const previous = await lookup(id);
      if (previous) return {prize: previous};
      try {
        // One statement holds the row lock until the chosen ticket is claimed.
        // SKIP LOCKED prevents concurrent participants from claiming the same ticket.
        const rows = await db.sql`
          UPDATE spin_tickets SET participant = ${id}::uuid, claimed_at = NOW()
          WHERE id = (SELECT id FROM spin_tickets WHERE participant IS NULL
                      ORDER BY random() LIMIT 1 FOR UPDATE SKIP LOCKED)
          RETURNING prize`;
        if (rows[0]) return {prize: rows[0].prize};
      } catch (error) {
        // Simultaneous retries of the same ID may race against the unique index.
        const existing = await lookup(id);
        if (existing) return {prize: existing};
        throw error;
      }
      const existing = await lookup(id);
      if (existing) return {prize: existing};
      const remaining = await db.sql`SELECT EXISTS(SELECT 1 FROM spin_tickets WHERE participant IS NULL) AS available`;
      return {status: remaining[0]?.available ? 'busy' : 'sold_out'};
    }
  };
}
