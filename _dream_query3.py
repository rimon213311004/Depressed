import sqlite3, json

db = sqlite3.connect('C:/Users/raiha/.local/share/mimocode/mimocode.db')
db.row_factory = sqlite3.Row
c = db.cursor()

# Get all messages from the current dream session (ses_09344c282ffeyVVw26aMRq4vBL)
print("=== CURRENT DREAM SESSION MESSAGES ===")
c.execute("""
    SELECT m.id, m.time_created, json_extract(m.data, '$.role') as role,
           substr(json_extract(m.data, '$.content'), 1, 500) as content_preview
    FROM message m
    WHERE m.session_id = 'ses_09344c282ffeyVVw26aMRq4vBL'
    ORDER BY m.time_created
""")
for r in c.fetchall():
    content = r['content_preview'] or ''
    print(f"  [{r['time_created']}] {r['role']}: {content[:400]}")

# Check for any sessions in the last 7 days for this project
print("\n\n=== ALL SESSIONS FOR DEPRESSED DIRECTORY ===")
c.execute("""
    SELECT id, directory, title, time_created 
    FROM session 
    WHERE directory LIKE '%Depressed%' OR directory LIKE '%depress%'
    ORDER BY time_created DESC
""")
for r in c.fetchall():
    print(f"  {r['id']} | {r['directory']} | {r['title']} | {r['time_created']}")

# Get the projects table to see if there's a project record for Depressed
print("\n\n=== PROJECTS TABLE ===")
c.execute("SELECT * FROM project")
for r in c.fetchall():
    print(dict(r))

db.close()
