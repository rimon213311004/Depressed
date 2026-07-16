import sqlite3, json

db = sqlite3.connect('C:/Users/raiha/.local/share/mimocode/mimocode.db')
db.row_factory = sqlite3.Row
c = db.cursor()

# Get tool calls from the main session to find file writes, errors, and decisions
print("=== TOOL CALLS (write/edit/bash) FROM MAIN SESSION ===")
c.execute("""
    SELECT m.time_created,
           json_extract(p.data, '$.tool') as tool,
           substr(json_extract(json_extract(p.data, '$.state'), '$.input'), 1, 500) as input_preview,
           substr(json_extract(json_extract(p.data, '$.state'), '$.output'), 1, 300) as output_preview
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = 'ses_093457f87ffeDRUGAosTFGMYBy'
      AND json_extract(p.data, '$.type') = 'tool'
      AND json_extract(p.data, '$.tool') IN ('write', 'edit', 'bash')
    ORDER BY m.time_created, p.time_created
""")
for r in c.fetchall():
    tool = r['tool']
    inp = (r['input_preview'] or '')[:250]
    out = (r['output_preview'] or '')[:200]
    print(f"  [{r['time_created']}] {tool}: {inp}")
    if out and ('error' in out.lower() or 'fail' in out.lower()):
        print(f"    OUTPUT: {out}")
    print()

# Get user messages with actual content (not empty)
print("\n=== USER MESSAGES WITH CONTENT ===")
c.execute("""
    SELECT m.time_created, json_extract(m.data, '$.content') as content
    FROM message m
    WHERE m.session_id = 'ses_093457f87ffeDRUGAosTFGMYBy'
      AND json_extract(m.data, '$.role') = 'user'
    ORDER BY m.time_created
""")
for r in c.fetchall():
    content = r['content'] or ''
    if len(content.strip()) > 5:
        print(f"  [{r['time_created']}] {content[:500]}")
        print()

# CORS session user messages
print("\n=== CORS SESSION USER MESSAGES ===")
c.execute("""
    SELECT m.time_created, json_extract(m.data, '$.content') as content
    FROM message m
    WHERE m.session_id = 'ses_09344c313ffeWWfZMdZwZI2KSZ'
      AND json_extract(m.data, '$.role') = 'user'
    ORDER BY m.time_created
""")
for r in c.fetchall():
    content = r['content'] or ''
    if len(content.strip()) > 2:
        print(f"  [{r['time_created']}] {content[:500]}")

db.close()
