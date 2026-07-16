import sqlite3, json, sys

db = sqlite3.connect('C:/Users/raiha/.local/share/mimocode/mimocode.db')
db.row_factory = sqlite3.Row
c = db.cursor()

# 1. List tables
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in c.fetchall()]
print("=== TABLES ===")
print(tables)

# 2. List sessions
print("\n=== SESSIONS ===")
c.execute("SELECT id, directory, title, time_created FROM session ORDER BY time_created DESC")
for r in c.fetchall():
    print(f"  {r['id']} | dir={r['directory']} | title={r['title']} | created={r['time_created']}")

# 3. List messages per session
print("\n=== MESSAGES BY SESSION ===")
c.execute("SELECT session_id, COUNT(*) as cnt, MIN(time_created) as first_msg, MAX(time_created) as last_msg FROM message GROUP BY session_id ORDER BY last_msg DESC")
for r in c.fetchall():
    print(f"  {r['session_id']} | {r['cnt']} messages | {r['first_msg']} to {r['last_msg']}")

# 4. Message roles per session
print("\n=== MESSAGE ROLES ===")
c.execute("SELECT session_id, json_extract(data, '$.role') as role, COUNT(*) as cnt FROM message GROUP BY session_id, role ORDER BY session_id, role")
for r in c.fetchall():
    print(f"  {r['session_id']} | role={r['role']} | count={r['cnt']}")

db.close()
