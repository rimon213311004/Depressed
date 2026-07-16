import sqlite3, json, sys

db = sqlite3.connect('C:/Users/raiha/.local/share/mimocode/mimocode.db')
db.row_factory = sqlite3.Row
c = db.cursor()

# Sessions in the Depressed directory
depressed_sessions = [
    'ses_093457f87ffeDRUGAosTFGMYBy',  # MERN STACK website - 46 msgs
    'ses_09344c313ffeWWfZMdZwZI2KSZ',  # CORS error - 5 msgs
    'ses_093457f9dffeaNSRv1K78tK9yA',  # whats the error - 2 msgs
]

for sid in depressed_sessions:
    print(f"\n{'='*80}")
    print(f"SESSION: {sid}")
    print('='*80)
    
    # Get user messages (to understand what they asked)
    c.execute("""
        SELECT m.id, m.time_created, json_extract(m.data, '$.role') as role,
               substr(json_extract(m.data, '$.content'), 1, 500) as content_preview
        FROM message m
        WHERE m.session_id = ? AND json_extract(m.data, '$.role') = 'user'
        ORDER BY m.time_created
    """, (sid,))
    print("\n--- USER MESSAGES ---")
    for r in c.fetchall():
        content = r['content_preview'] or ''
        print(f"  [{r['time_created']}] {content[:300]}")
    
    # Get assistant text parts (to find decisions, errors, knowledge)
    c.execute("""
        SELECT m.id as msg_id, m.time_created,
               json_extract(p.data, '$.type') as part_type,
               substr(p.data, 1, 1200) as preview
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE m.session_id = ? AND json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'text'
        ORDER BY m.time_created, p.time_created
    """, (sid,))
    print("\n--- ASSISTANT TEXT (first 300 chars each) ---")
    for r in c.fetchall():
        # Extract just the text field from the JSON
        try:
            pdata = json.loads(r['preview'])
            text = pdata.get('text', '')[:300]
        except:
            text = r['preview'][:300]
        print(f"  [{r['time_created']}] {text}")
        print()

db.close()
