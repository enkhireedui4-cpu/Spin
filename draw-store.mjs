import { DatabaseSync } from 'node:sqlite';
import { createDrawPool } from './draw-pool.mjs';

/** Persistent allocation; all draws are serialized with a SQLite write transaction. */
export class DrawStore {
  constructor(path) {
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS entries (position INTEGER PRIMARY KEY, result TEXT NOT NULL CHECK (result IN (\'towel\',\'freshener\',\'foam\',\'loss\')), participant TEXT UNIQUE)');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const { count } = this.db.prepare('SELECT count(*) AS count FROM entries').get();
      if (count === 0) {
        const insert = this.db.prepare('INSERT INTO entries (position, result) VALUES (?, ?)');
        createDrawPool().forEach((result, index) => insert.run(index + 1, result));
      } else if (count !== 300) {
        throw new Error('Invalid event data: expected exactly 300 entries');
      }
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  draw(participant) {
    if (typeof participant !== 'string' || participant.length < 1 || participant.length > 128) throw new TypeError('Invalid participant ID');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const previous = this.db.prepare('SELECT result FROM entries WHERE participant = ?').get(participant);
      if (previous) {
        this.db.exec('COMMIT');
        return { status: 'drawn', result: previous.result };
      }
      const entry = this.db.prepare('SELECT position, result FROM entries WHERE participant IS NULL ORDER BY position LIMIT 1').get();
      if (!entry) {
        this.db.exec('COMMIT');
        return { status: 'sold_out' };
      }
      this.db.prepare('UPDATE entries SET participant = ? WHERE position = ?').run(participant, entry.position);
      this.db.exec('COMMIT');
      return { status: 'drawn', result: entry.result };
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  lookup(participant) {
    const row = this.db.prepare('SELECT result FROM entries WHERE participant = ?').get(participant);
    return row ? { status: 'drawn', result: row.result } : null;
  }
  count() { return this.db.prepare('SELECT count(*) AS count FROM entries WHERE participant IS NOT NULL').get().count; }
  close() { this.db.close(); }
}

