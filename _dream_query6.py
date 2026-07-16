import sqlite3, json

db = sqlite3.connect('C:/Users/raiha/.local/share/mimocode/mimocode.db')
db.row_factory = sqlite3.Row
c = db.cursor()

# Get user messages from the main session (content is in parts)
print("=== USER MESSAGES (from parts) ===")
c.execute("""
    SELECT p.time_created, json_extract(p.data, '$.text') as text
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_093457f87ffeDRUGAosTFGMYBy'
      AND json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
    ORDER BY p.time_created
""")
for r in c.fetchall():
    text = r['text'] or ''
    if len(text.strip()) > 5:
        print(f"  [{r['time_created']}] {text[:500]}")
        print()

# Get tool calls from the main session
print("\n=== TOOL CALLS ===")
c.execute("""
    SELECT m.time_created,
           json_extract(p.data, '$.tool') as tool,
           substr(json_extract(json_extract(p.data, '$.state'), '$.input'), 1, 600) as input_preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_093457f87ffeDRUGAosTFGMYBy'
      AND json_extract(p.data, '$.type') = 'tool'
    ORDER BY m.time_created, p.time_created
""")
for r in c.fetchall():
    tool = r['tool'] or 'unknown'
    inp = (r['input_preview'] or '')[:400]
    print(f"  [{r['time_created']}] {tool}: {inp}")
    print()

# Get user messages from CORS session
print("\n=== CORS SESSION USER MESSAGES ===")
c.execute("""
    SELECT p.time_created, json_extract(p.data, '$.text') as text
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_09344c313ffeWWfZMdZwZI2KSZ'
      AND json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
    ORDER BY p.time_created
""")
for r in c.fetchall():
    text = r['text'] or ''
    if len(text.strip()) > 2:
        print(f"  [{r['time_created']}] {text[:500]}")

db.close()
