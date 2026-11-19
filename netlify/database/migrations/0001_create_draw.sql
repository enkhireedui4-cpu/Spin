CREATE TABLE spin_tickets (
  id integer PRIMARY KEY CHECK (id BETWEEN 1 AND 300),
  prize text NOT NULL CHECK (prize IN ('towel', 'freshener', 'foam', 'loss')),
  participant uuid UNIQUE,
  claimed_at timestamptz
);

INSERT INTO spin_tickets (id, prize)
SELECT id, CASE WHEN id <= 30 THEN 'towel'
                WHEN id <= 60 THEN 'freshener'
                WHEN id <= 90 THEN 'foam'
                ELSE 'loss' END
FROM generate_series(1, 300) AS id;
