import sqlite3, json

db = sqlite3.connect('C:/Users/raiha/.local/share/mimocode/mimocode.db')
db.row_factory = sqlite3.Row
c = db.cursor()

# Check the structure of a message
print("=== MESSAGE STRUCTURE SAMPLE ===")
c.execute("""
    SELECT data FROM message 
    WHERE session_id = 'ses_093457f87ffeDRUGAosTFGMYBy'
    ORDER BY time_created LIMIT 3
""")
for r in c.fetchall():
    print(json.dumps(json.loads(r['data']), indent=2)[:1000])
    print("---")

# Check part structure
print("\n=== PART STRUCTURE SAMPLE ===")
c.execute("""
    SELECT p.data FROM part p
    JOIN message m ON p.message_id = m.id
    WHERE m.session_id = 'ses_093457f87ffeDRUGAosTFGMYBy'
    ORDER BY m.time_created, p.time_created
    LIMIT 3
""")
for r in c.fetchall():
    parsed = json.loads(r['data'])
    print(json.dumps(parsed, indent=2)[:1000])
    print("---")

db.close()
