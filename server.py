"""
CredGen — Enterprise Relational Backend & UGC CBCS Evaluation Engine
Database: SQLite3 embedded persistent storage (credgen.db)
Protocols: RESTful JSON API with full CORS compliance
Architecture: Multi-Module Institutional Academic Governance
"""

import http.server
import socketserver
import json
import sqlite3
import os
import sys
import time
import random
import secrets
import hashlib
import urllib.parse
import urllib.request
import threading
import mimetypes
import gzip

def load_env_file():
    env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(env_file):
        try:
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k and k not in os.environ:
                            os.environ[k] = v
        except Exception:
            pass

load_env_file()

from datetime import datetime, timedelta

DEFAULT_PORTS = [5173, 5000]

def resolve_database_path():
    # 1. Explicit DB_PATH or DB_FILE environment variable
    env_db = os.environ.get("DB_PATH") or os.environ.get("DB_FILE")
    if env_db:
        os.makedirs(os.path.dirname(os.path.abspath(env_db)), exist_ok=True)
        return env_db

    # 2. Railway / Cloud Persistent Volume Mount
    # Checks RAILWAY_VOLUME_MOUNT_PATH, DATA_DIR, or if /data directory exists and is writable
    vol_dir = os.environ.get("RAILWAY_VOLUME_MOUNT_PATH") or os.environ.get("DATA_DIR")
    if not vol_dir and os.path.isdir("/data") and os.access("/data", os.W_OK):
        vol_dir = "/data"

    if vol_dir:
        os.makedirs(vol_dir, exist_ok=True)
        persistent_file = os.path.join(vol_dir, "credgen.db")
        # On first volume mount, copy the bundled repository seed database if persistent file does not exist
        bundled_seed = os.path.join(os.path.dirname(os.path.abspath(__file__)), "credgen.db")
        if not os.path.exists(persistent_file) and os.path.exists(bundled_seed):
            try:
                import shutil
                shutil.copy2(bundled_seed, persistent_file)
                print(f"[DB-PERSISTENCE] Initialized persistent volume database: {persistent_file}")
            except Exception as e:
                print(f"[DB-PERSISTENCE] Warning copying initial seed to volume: {e}")
        return persistent_file

    # 3. Default workspace file for local development
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "credgen.db")

DB_FILE = resolve_database_path()

# UGC Choice Based Credit System (CBCS) 10-Point Conversion Scale
CBCS_GRADE_RULES = [
    {"min": 90.0, "max": 100.0, "grade": "O", "gp": 10, "desc": "Outstanding"},
    {"min": 80.0, "max": 89.99, "grade": "A+", "gp": 9, "desc": "Excellent"},
    {"min": 70.0, "max": 79.99, "grade": "A", "gp": 8, "desc": "Very Good"},
    {"min": 60.0, "max": 69.99, "grade": "B+", "gp": 7, "desc": "Good"},
    {"min": 50.0, "max": 59.99, "grade": "B", "gp": 6, "desc": "Above Average"},
    {"min": 45.0, "max": 49.99, "grade": "C", "gp": 5, "desc": "Average"},
    {"min": 40.0, "max": 44.99, "grade": "P", "gp": 4, "desc": "Pass"},
    {"min": 0.0, "max": 39.99, "grade": "F", "gp": 0, "desc": "Fail"}
]

def calculate_grade(total_mark):
    try:
        val = float(total_mark)
    except (ValueError, TypeError):
        val = 0.0
    for rule in CBCS_GRADE_RULES:
        if val >= rule["min"] and val <= rule["max"]:
            return rule["grade"], rule["gp"], rule["desc"]
    return "F", 0, "Fail"

def compute_sgpa(courses):
    total_credits = 0.0
    total_credit_points = 0.0
    evaluated = []

    for c in courses:
        credits = float(c.get("credits", 3.0))
        internal = float(c.get("internal", 0.0))
        mid_term = float(c.get("midTerm", 0.0))
        end_term = float(c.get("endTerm", 0.0))
        total = round(internal + mid_term + end_term, 2)
        letter, gp, desc = calculate_grade(total)
        cp = round(credits * gp, 2)

        total_credits += credits
        total_credit_points += cp

        course_copy = dict(c)
        course_copy["total"] = total
        course_copy["letterGrade"] = letter
        course_copy["gradePoint"] = gp
        course_copy["creditPoints"] = cp
        evaluated.append(course_copy)

    sgpa = round(total_credit_points / total_credits, 2) if total_credits > 0 else 0.0
    return evaluated, total_credits, total_credit_points, sgpa

# Cryptographic Salt for Secure OTP Hashing
OTP_SECRET_SALT = os.environ.get("CREDGEN_OTP_SALT") or "credgen_production_otp_salt_2026_secure"

def hash_otp(identifier: str, otp_code: str) -> str:
    """Store only salted SHA-256 hash of OTP. Plaintext OTP is NEVER stored in database."""
    clean_id = (identifier or '').strip().lower()
    clean_code = (otp_code or '').strip()
    return hashlib.sha256(f"{clean_id}:{clean_code}:{OTP_SECRET_SALT}".encode("utf-8")).hexdigest()

def send_real_email_otp(recipient_email: str, recipient_name: str, otp_code: str):
    """
    Dispatch real verification code via external SMTP provider (Gmail, SendGrid, Amazon SES, Brevo, etc.).
    If SMTP provider credentials are not configured in environment, strictly returns False with setup instructions.
    """
    smtp_host = os.environ.get("SMTP_HOST", "").strip()
    smtp_port_raw = os.environ.get("SMTP_PORT", "587").strip()
    smtp_port = int(smtp_port_raw) if smtp_port_raw.isdigit() else 587
    smtp_user = os.environ.get("SMTP_USER", "").strip()
    smtp_pass = (os.environ.get("SMTP_PASSWORD") or os.environ.get("SMTP_PASS", "")).strip()
    smtp_from = os.environ.get("SMTP_FROM", "").strip() or (f"CredGen Security <{smtp_user}>" if smtp_user else "CredGen Security <no-reply@credgen.mmdu.ac.in>")

    if not smtp_host or not smtp_user or not smtp_pass:
        return False, (
            "Email delivery provider is not configured on this server. "
            "To enable real email OTP delivery, please configure the following environment variables: "
            "SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD (e.g. Gmail App Password or SendGrid API key)."
        )

    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"CredGen Security Verification Code: {otp_code} (Valid for 10 minutes)"
        msg['From'] = smtp_from
        msg['To'] = recipient_email

        plain_text = f"""Hello {recipient_name},

Your one-time security verification code for CredGen Institutional Examination Platform is:

{otp_code}

This code is valid for 10 minutes. If you did not request this verification, please contact your examination administrator immediately. Do not share this code with anyone.

Maharishi Markandeshwar (Deemed to be University), Mullana
Examination Control Board & Department of Computer Science & Engineering
"""

        html_text = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #090d16; color: #e2e8f0; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
    <div style="color: #6366f1; font-weight: 800; font-size: 18px; letter-spacing: -0.5px;">CREDGEN INSTITUTIONAL PORTAL</div>
    <div style="color: #94a3b8; font-size: 11px; margin-top: 2px; margin-bottom: 24px;">Maharishi Markandeshwar (Deemed to be University), Mullana</div>
    <p style="font-size: 14px; margin-bottom: 8px;">Hello <strong>{recipient_name}</strong>,</p>
    <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin-bottom: 20px;">Your confidential verification code for identity verification and password recovery is:</p>
    <div style="background: #020617; border: 1px solid #312e81; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
      <div style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #38bdf8;">{otp_code}</div>
    </div>
    <p style="font-size: 12px; color: #94a3b8; line-height: 1.6;">This code is valid for <strong>10 minutes</strong>. For your security, do not disclose this code to anyone. CredGen administrators will never ask for your verification code.</p>
    <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; text-align: center;">
      Automated Security Notification &bull; Examination Control Board & CSE
    </div>
  </div>
</body>
</html>"""

        msg.attach(MIMEText(plain_text, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_text, 'html', 'utf-8'))

        if smtp_port == 465:
            import ssl
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=15) as server:
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)

        return True, "Verification code sent to your registered email."
    except Exception as e:
        return False, f"Failed to dispatch email via SMTP ({smtp_host}): {str(e)}"

def send_real_sms_otp(recipient_phone: str, otp_code: str):
    """
    Dispatch real verification code via Twilio SMS provider.
    If Twilio credentials are not configured, strictly returns False with setup instructions.
    """
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID", "").strip()
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN", "").strip()
    from_number = os.environ.get("TWILIO_FROM_NUMBER", "").strip()

    if not account_sid or not auth_token or not from_number:
        return False, "SMS verification is currently unavailable. Please use Email verification."

    try:
        import urllib.request, urllib.parse, base64
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        data = urllib.parse.urlencode({
            "To": recipient_phone,
            "From": from_number,
            "Body": f"CredGen Security: Your verification code is {otp_code}. Valid for 10 minutes. Do not share."
        }).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST")
        auth = base64.b64encode(f"{account_sid}:{auth_token}".encode("utf-8")).decode("ascii")
        req.add_header("Authorization", f"Basic {auth}")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        with urllib.request.urlopen(req, timeout=15) as resp:
            if 200 <= resp.status < 300:
                return True, "SMS verification code dispatched successfully."
            return False, f"SMS provider returned HTTP {resp.status}."
    except Exception as e:
        return False, f"Failed to dispatch SMS: {str(e)}" 

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    iterations = 100000
    derived = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), iterations)
    return f"pbkdf2:sha256:{iterations}${salt}${derived.hex()}"

def verify_and_upgrade_password(raw_password: str, stored_password: str):
    if not stored_password:
        return False, False
    if stored_password.startswith("pbkdf2:sha256:"):
        try:
            parts = stored_password.split("$")
            header, salt, hash_val = parts[0], parts[1], parts[2]
            iterations = int(header.split(":")[2])
            derived = hashlib.pbkdf2_hmac('sha256', raw_password.encode('utf-8'), salt.encode('utf-8'), iterations)
            is_valid = secrets.compare_digest(derived.hex(), hash_val)
            return is_valid, False
        except Exception:
            return False, False
    else:
        # Legacy plain text password: verify and request upgrade
        is_valid = (raw_password == stored_password)
        return is_valid, is_valid

def verify_password(raw_password: str, stored_password: str) -> bool:
    """Verify user password against PBKDF2 hash or legacy hash with constant-time comparison."""
    valid, _ = verify_and_upgrade_password(raw_password, stored_password)
    return bool(valid)

def find_user_by_identifier(cursor, raw_identifier: str, only_active: bool = False):
    """
    Universally lookup user across roll number, faculty ID, institutional email, phone, or ID.
    If only_active=True, restricts results to status='ACTIVE'.
    """
    if not raw_identifier:
        return None
    raw = str(raw_identifier).strip()
    if not raw:
        return None
    raw_lower = raw.lower()
    status_clause = " AND status = 'ACTIVE'" if only_active else ""
    
    # 1. Exact match on email, phone, roll_no, faculty_id, or id
    cursor.execute(f"""
        SELECT * FROM users
        WHERE (
            LOWER(email) = ? OR 
            phone = ? OR 
            roll_no = ? OR 
            LOWER(faculty_id) = ? OR 
            id = ?
        ){status_clause}
    """, (raw_lower, raw, raw, raw_lower, raw))
    row = cursor.fetchone()
    if row:
        return dict(row)

    # 2. Case-insensitive / normalized faculty ID
    norm_faculty = raw_lower.replace(' ', '-').replace('/', '-').replace('_', '-')
    cursor.execute(f"""
        SELECT * FROM users
        WHERE LOWER(REPLACE(REPLACE(REPLACE(COALESCE(faculty_id, ''), ' ', '-'), '/', '-'), '_', '-')) = ?
          {status_clause}
    """, (norm_faculty,))
    row = cursor.fetchone()
    if row:
        return dict(row)

    # 3. Phone number matching (match by last 10 digits)
    digits = ''.join(c for c in raw if c.isdigit())
    if len(digits) >= 10:
        last10 = digits[-10:]
        cursor.execute(f"SELECT * FROM users WHERE 1=1{status_clause}")
        for r in cursor.fetchall():
            u_phone = r['phone'] or ''
            u_digits = ''.join(c for c in u_phone if c.isdigit())
            if u_digits.endswith(last10):
                return dict(r)

    # 4. Roll number normalized (digits only)
    if digits and len(digits) >= 6:
        cursor.execute(f"SELECT * FROM users WHERE 1=1{status_clause}")
        for r in cursor.fetchall():
            u_roll = r['roll_no'] or ''
            u_roll_digits = ''.join(c for c in u_roll if c.isdigit())
            if u_roll_digits and u_roll_digits == digits:
                return dict(r)

    # 5. Match by full name
    cursor.execute(f"SELECT * FROM users WHERE LOWER(name) = ?{status_clause}", (raw_lower,))
    row = cursor.fetchone()
    if row:
        return dict(row)

    return None

def generate_session_token() -> str:
    return secrets.token_hex(32)

def get_user_by_session(token: str):
    if not token:
        return None
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT u.id, u.name, u.email, u.phone, u.role, u.department, u.institution,
               u.designation, u.roll_no, u.faculty_id, u.avatar, u.status, u.created_at,
               s.expires_at as session_expires_at
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > datetime('now') AND u.status = 'ACTIVE'
    """, (token,))
    row = cur.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    conn = get_db_connection()
    cur = conn.cursor()

    # 1. Users Table (with real verification & lifecycle status)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT,
        institution TEXT,
        designation TEXT,
        roll_no TEXT,
        faculty_id TEXT,
        avatar TEXT,
        status TEXT DEFAULT 'ACTIVE',
        email_verified INTEGER DEFAULT 0,
        phone_verified INTEGER DEFAULT 0,
        rejection_reason TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cur.execute("PRAGMA table_info(users)")
    u_cols = {c[1]: c for c in cur.fetchall()}
    if 'email_verified' not in u_cols:
        cur.execute("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0")
    if 'phone_verified' not in u_cols:
        cur.execute("ALTER TABLE users ADD COLUMN phone_verified INTEGER DEFAULT 0")
    if 'rejection_reason' not in u_cols:
        cur.execute("ALTER TABLE users ADD COLUMN rejection_reason TEXT DEFAULT ''")

    # 1b. Production Security Sessions Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # 1c. Production OTP Verification & Password Recovery Table (Salted SHA-256 Hash Only)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS otps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        identifier TEXT NOT NULL,
        otp_hash TEXT,
        otp_code TEXT DEFAULT '',
        purpose TEXT NOT NULL,
        reset_token TEXT,
        attempts INTEGER DEFAULT 0,
        verified INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
    )
    """)
    # Seamless SQLite schema migration for otp_hash and legacy otp_code
    cur.execute("PRAGMA table_info(otps)")
    cols_dict = {c[1]: c for c in cur.fetchall()}
    if 'otp_hash' not in cols_dict:
        cur.execute("ALTER TABLE otps ADD COLUMN otp_hash TEXT")
    if 'otp_code' in cols_dict and cols_dict['otp_code'][3] == 1:
        cur.execute("""
        CREATE TABLE otps_clean (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            identifier TEXT NOT NULL,
            otp_hash TEXT,
            otp_code TEXT DEFAULT '',
            purpose TEXT NOT NULL,
            reset_token TEXT,
            attempts INTEGER DEFAULT 0,
            verified INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL
        )
        """)
        cur.execute("""
        INSERT INTO otps_clean (id, identifier, otp_hash, otp_code, purpose, reset_token, attempts, verified, created_at, expires_at)
        SELECT id, identifier, otp_hash, otp_code, purpose, reset_token, attempts, verified, created_at, expires_at FROM otps
        """)
        cur.execute("DROP TABLE otps")
        cur.execute("ALTER TABLE otps_clean RENAME TO otps")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_otps_ident_purpose ON otps(identifier, purpose)")

    # 2. Questions Repository Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        course_name TEXT NOT NULL,
        unit TEXT,
        topic TEXT,
        type TEXT NOT NULL,
        difficulty TEXT DEFAULT 'Medium',
        marks REAL DEFAULT 2.0,
        negative_marks REAL DEFAULT 0.5,
        question_text TEXT NOT NULL,
        options_json TEXT,
        correct_option_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 3. Examinations Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS exams (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        course_id TEXT NOT NULL,
        course_name TEXT NOT NULL,
        exam_type TEXT,
        total_marks REAL DEFAULT 20.0,
        passing_marks REAL DEFAULT 8.0,
        duration_minutes INTEGER DEFAULT 45,
        negative_marking INTEGER DEFAULT 1,
        negative_mark_value REAL DEFAULT 0.5,
        credit_weight REAL DEFAULT 4.0,
        status TEXT DEFAULT 'ACTIVE',
        assigned_batches_json TEXT,
        created_by TEXT,
        question_ids_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 4. Marksheet & Academic Transcripts Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS marksheets (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        roll_no TEXT NOT NULL,
        program TEXT NOT NULL,
        semester TEXT NOT NULL,
        batch TEXT NOT NULL,
        courses_json TEXT NOT NULL,
        sgpa REAL DEFAULT 0.0,
        total_credits REAL DEFAULT 0.0,
        publish_status TEXT DEFAULT 'DRAFT',
        published_by TEXT,
        published_at TEXT,
        verification_hash TEXT,
        qr_payload TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 5. Proctoring Forensic Audits Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS proctor_sessions (
        id TEXT PRIMARY KEY,
        candidate_name TEXT NOT NULL,
        roll_no TEXT NOT NULL,
        exam_code TEXT NOT NULL,
        exam_title TEXT NOT NULL,
        duration TEXT,
        violations INTEGER DEFAULT 0,
        decibels TEXT,
        risk_level TEXT NOT NULL,
        risk_score INTEGER DEFAULT 0,
        anomaly_flags_json TEXT,
        status TEXT NOT NULL,
        archive_status TEXT DEFAULT 'ACTIVE',
        avatar TEXT,
        video_url TEXT,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

        # MASTER ACCOUNT SPECIFICATION: Keep ONLY Vivek as the Active Administrator
    # Purge only obsolete legacy demo accounts
    cur.execute("DELETE FROM users WHERE id IN ('usr_admin_shashank', 'usr_teacher_1', 'usr_student_rahul')")

    vivek_pwd_hash = hash_password('Vivek@Admin2026#')
    cur.execute("SELECT id, password FROM users WHERE id = 'usr_admin_vivek' OR LOWER(email) = 'vr5655881@gmail.com'")
    vivek_row = cur.fetchone()
    if vivek_row:
        # Keep Vivek's admin profile active, but NEVER overwrite an existing custom password!
        cur.execute("""
        UPDATE users SET
            id = 'usr_admin_vivek',
            name = 'Vivek',
            email = 'vr5655881@gmail.com',
            phone = '7281041275',
            role = 'ADMIN',
            status = 'ACTIVE',
            department = 'Examination Control Board & CSE',
            institution = 'Maharishi Markandeshwar (Deemed to be University), Mullana',
            designation = 'Chief Administrator & Project Lead',
            roll_no = '11242634',
            email_verified = 1,
            phone_verified = 1
        WHERE id = ?
        """, (vivek_row['id'],))
        # Only set initial password if the user record has NO password at all
        if not vivek_row['password']:
            cur.execute("UPDATE users SET password = ? WHERE id = 'usr_admin_vivek'", (vivek_pwd_hash,))
    else:
        # First-time initialization only
        cur.execute("""
        INSERT INTO users (id, name, email, phone, password, role, department, institution, designation, roll_no, faculty_id, avatar, status, email_verified, phone_verified)
        VALUES ('usr_admin_vivek', 'Vivek', 'vr5655881@gmail.com', '7281041275', ?, 'ADMIN', 'Examination Control Board & CSE', 'Maharishi Markandeshwar (Deemed to be University), Mullana', 'Chief Administrator & Project Lead', '11242634', NULL, '', 'ACTIVE', 1, 1)
        """, (vivek_pwd_hash,))

    # Keep all registered student, faculty, and administrative accounts safe
    cur.execute("DELETE FROM users WHERE id IN ('usr_admin_shashank', 'usr_teacher_1', 'usr_student_rahul')")
    conn.commit()
    print(f"[DB-INIT] Master user database synchronized ({DB_FILE}). Administrator: Vivek (vr5655881@gmail.com).")

    cur.execute("SELECT COUNT(*) as count FROM questions")
    if cur.fetchone()["count"] == 0:
        initial_questions = [
            (
                'qb_101', 'CS-302', 'Database Management Systems', 'Unit 2: Relational Model & SQL',
                'ACID Properties & Transactions', 'MCQ', 'Medium', 2.0, 0.5,
                'Which transaction property ensures that all operations in a transaction are executed completely or not executed at all?',
                json.dumps([{'id': 'opt_1', 'text': 'Atomicity'}, {'id': 'opt_2', 'text': 'Consistency'}, {'id': 'opt_3', 'text': 'Isolation'}, {'id': 'opt_4', 'text': 'Durability'}]),
                'opt_1'
            ),
            (
                'qb_102', 'CS-302', 'Database Management Systems', 'Unit 3: Normalization & Schema Refinement',
                'Boyce-Codd Normal Form (BCNF)', 'MCQ', 'Hard', 2.0, 0.5,
                'A relation R is in BCNF if for every non-trivial functional dependency X -> Y:',
                json.dumps([{'id': 'opt_1', 'text': 'X is a superkey for R'}, {'id': 'opt_2', 'text': 'Y is a prime attribute'}, {'id': 'opt_3', 'text': 'X is a subset of candidate key'}, {'id': 'opt_4', 'text': 'R contains no multi-valued dependencies'}]),
                'opt_1'
            ),
            (
                'qb_103', 'CS-304', 'Design & Analysis of Algorithms', 'Unit 1: Asymptotic Analysis & Recurrences',
                'Master Theorem for Divide-and-Conquer', 'MCQ', 'Medium', 2.0, 0.5,
                'What is the asymptotic time complexity of the recurrence T(n) = 2T(n/2) + O(n)?',
                json.dumps([{'id': 'opt_1', 'text': 'O(n log n)'}, {'id': 'opt_2', 'text': 'O(n^2)'}, {'id': 'opt_3', 'text': 'O(log n)'}, {'id': 'opt_4', 'text': 'O(n)'}]),
                'opt_1'
            ),
            (
                'qb_104', 'CS-304', 'Design & Analysis of Algorithms', 'Unit 3: Dynamic Programming',
                '0/1 Knapsack & Bellman Equation', 'SUBJECTIVE', 'Hard', 5.0, 0.0,
                'State the recurrence relation for the 0/1 Knapsack Problem with n items and capacity W, and explain why the greedy approach fails for 0/1 Knapsack.',
                json.dumps([]),
                ''
            ),
            (
                'qb_105', 'CS-306', 'Computer Networks & Security', 'Unit 4: Transport Layer Protocols',
                'TCP Congestion Control & 3-Way Handshake', 'MCQ', 'Medium', 2.0, 0.5,
                'During TCP Connection Establishment, what flags are set in the second packet sent from server to client?',
                json.dumps([{'id': 'opt_1', 'text': 'SYN + ACK'}, {'id': 'opt_2', 'text': 'SYN only'}, {'id': 'opt_3', 'text': 'ACK only'}, {'id': 'opt_4', 'text': 'FIN + ACK'}]),
                'opt_1'
            ),
            (
                'qb_106', 'CS-308', 'Software Engineering & Cloud Architecture', 'Unit 2: Agile Methodologies & Scrum',
                'Sprint Retrospectives & CI/CD Pipelines', 'MCQ', 'Easy', 2.0, 0.5,
                'In Scrum framework, what is the primary purpose of the Daily Standup (Scrum) meeting?',
                json.dumps([{'id': 'opt_1', 'text': 'Synchronize activities and identify blockers within 15 minutes'}, {'id': 'opt_2', 'text': 'Conduct formal performance review of engineers'}, {'id': 'opt_3', 'text': 'Demonstrate completed user stories to stakeholders'}, {'id': 'opt_4', 'text': 'Estimate story points for product backlog'}]),
                'opt_1'
            ),
            (
                'qb_107', 'CS-310', 'Artificial Intelligence & Machine Learning', 'Unit 2: Informed Search & Heuristics',
                'A* Search Admissibility', 'MCQ', 'Hard', 2.0, 0.5,
                'A heuristic h(n) in A* tree search is considered admissible if:',
                json.dumps([{'id': 'opt_1', 'text': 'It never overestimates the true cost to reach the goal'}, {'id': 'opt_2', 'text': 'It is always equal to the true cost'}, {'id': 'opt_3', 'text': 'It satisfies the triangle inequality h(n) <= c(n, a, n\u2032) + h(n\u2032)'}, {'id': 'opt_4', 'text': 'It is monotonic and non-negative only'}]),
                'opt_1'
            )
        ]
        cur.executemany("""
        INSERT INTO questions (id, course_id, course_name, unit, topic, type, difficulty, marks, negative_marks, question_text, options_json, correct_option_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_questions)
        print("[DB-INIT] Initialized Question Bank with 7 university curriculum questions.")

    cur.execute("SELECT COUNT(*) as count FROM exams")
    if cur.fetchone()["count"] == 0:
        cur.execute("""
        INSERT INTO exams (id, title, course_id, course_name, exam_type, total_marks, passing_marks, duration_minutes, negative_marking, negative_mark_value, credit_weight, status, assigned_batches_json, created_by, question_ids_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            'exam_2026_dbms_mid', 'Mid-Semester Assessment — DBMS (CS-302)', 'CS-302', 'Database Management Systems',
            'Hybrid Assessment (Objective + Structured)', 20.0, 8.0, 45, 1, 0.5, 4.0, 'ACTIVE',
            json.dumps(['B.Tech CSE Section C (2026)']), 'Dr. Vinsha Sumra', json.dumps(['qb_101', 'qb_102'])
        ))
        print("[DB-INIT] Initialized default institutional exam.")

    cur.execute("SELECT COUNT(*) as count FROM marksheets")
    if cur.fetchone()["count"] == 0:
        initial_records = [
            {
                "id": "rec_rahul_sem6",
                "student_id": "usr_student_rahul",
                "student_name": "Rahul Verma",
                "roll_no": "11242601",
                "program": "B.Tech in Computer Science & Engineering",
                "semester": "Semester VI (Session 2026\u20132027)",
                "batch": "2023\u20132027",
                "publish_status": "DRAFT",
                "published_by": None,
                "published_at": None,
                "courses": [
                    {"code": "CS-302", "title": "Database Management Systems", "credits": 4, "internal": 26, "midTerm": 18, "endTerm": 44.5, "maxMarks": 100}
                ]
            },
            {
                "id": "rec_vivek_sem6",
                "student_id": "usr_admin_vivek",
                "student_name": "Vivek Kumar",
                "roll_no": "11242634",
                "program": "B.Tech in Computer Science & Engineering",
                "semester": "Semester VI (Session 2026\u20132027)",
                "batch": "2023\u20132027",
                "publish_status": "PUBLISHED",
                "published_by": "Dr. Vinsha Sumra",
                "published_at": "2026-09-01 11:30 AM",
                "courses": [
                    {"code": "CS-306", "title": "Computer Networks & Cyber Security", "credits": 3, "internal": 28, "midTerm": 19, "endTerm": 43.5, "maxMarks": 100}
                ]
            },
            {
                "id": "rec_shashank_sem6",
                "student_id": "usr_admin_shashank",
                "student_name": "Banda Shashank",
                "roll_no": "11242656",
                "program": "B.Tech in Computer Science & Engineering",
                "semester": "Semester VI (Session 2026\u20132027)",
                "batch": "2023\u20132027",
                "publish_status": "PUBLISHED",
                "published_by": "Dr. Vinsha Sumra",
                "published_at": "2026-09-01 11:30 AM",
                "courses": [
                    {"code": "CS-306", "title": "Computer Networks & Cyber Security", "credits": 3, "internal": 27, "midTerm": 18, "endTerm": 42.0, "maxMarks": 100}
                ]
            }
        ]

        for r in initial_records:
            eval_courses, tot_cred, tot_cp, sgpa = compute_sgpa(r["courses"])
            v_hash = hashlib.sha256(f"{r['id']}_{r['roll_no']}_{sgpa}".encode('utf-8')).hexdigest()
            cur.execute("""
            INSERT INTO marksheets (id, student_id, student_name, roll_no, program, semester, batch, courses_json, sgpa, total_credits, publish_status, published_by, published_at, verification_hash, qr_payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                r['id'], r['student_id'], r['student_name'], r['roll_no'],
                r['program'], r['semester'], r['batch'],
                json.dumps(eval_courses), sgpa, tot_cred, r['publish_status'], r['published_by'], r['published_at'],
                v_hash, f"CREDGEN-VERIFY-{r['roll_no']}"
            ))
        print("[DB-INIT] Initialized authentic candidate marksheet dossiers.")

    cur.execute("SELECT COUNT(*) as count FROM proctor_sessions")
    if cur.fetchone()["count"] == 0:
        cur.executemany("""
        INSERT INTO proctor_sessions (id, candidate_name, roll_no, exam_code, exam_title, duration, violations, decibels, risk_level, risk_score, anomaly_flags_json, status, archive_status, avatar, video_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            (
                'audit_101', 'Amanpreet Singh', '11242605', 'CS-302', 'Mid-Semester Assessment \u2014 DBMS (CS-302)',
                '01:30 (Session Flagged)', 2, '74 dB (Loud Background Voice / Multiple Speakers)', 'HIGH_RISK', 98,
                json.dumps(['[INCIDENT] Multiple Persons Detected in Camera Feed', '[INCIDENT] Mobile Device Screen Glow Detected', '[INCIDENT] Unauthorized Window Switch (2 Violations - Auto Terminated)']),
                'MALPRACTICE TERMINATED (0 GP)', 'ACTIVE', '', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
            ),
            (
                'audit_102', 'Pooja Kashyap', '11242614', 'CS-302', 'Mid-Semester Assessment \u2014 DBMS (CS-302)',
                '01:30 (Warning Issued)', 1, '58 dB (Suspicious Whispering)', 'SUSPICIOUS', 78,
                json.dumps(['[ALERT] Eye Gaze Deviation (>18s Looking Off-Screen to the Right)', '[ALERT] Frequent Head & Body Movement', '[ALERT] Tab Focus Lost']),
                'WARNING ISSUED (PROBATION)', 'ACTIVE', '', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
            )
        ])
        print("[DB-INIT] Initialized proctoring forensic audit sessions.")

    # 6. Institutional Support Desk, Feedback & Grievances Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS support_queries (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'GUEST',
        type TEXT NOT NULL DEFAULT 'QUERY',
        category TEXT NOT NULL DEFAULT 'GENERAL',
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'NORMAL',
        status TEXT NOT NULL DEFAULT 'OPEN',
        admin_notes TEXT,
        resolved_by TEXT,
        resolved_at TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cur.execute("SELECT COUNT(*) as count FROM support_queries")
    if cur.fetchone()["count"] == 0:
        cur.executemany("""
        INSERT INTO support_queries (id, user_id, name, email, phone, role, type, category, subject, message, priority, status, admin_notes, resolved_by, resolved_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            (
                'sup_101', 'usr_student_rahul', 'Rahul Verma', 'rahul.verma@student.mmdu.ac.in', '+91 98980 11223',
                'STUDENT', 'RE_EVALUATION', 'MARKSHEET',
                'Re-evaluation Request for CS-302 Mid-Term Assessment',
                'Respected Examination Directorate, I kindly request an evaluation re-check of Question 3 in DBMS exam (CS-302). My internal marks calculation seems to be missing 2 marks for the indexing and transaction properties problem.',
                'HIGH', 'OPEN', 'Under review by Examination Controller Banda Shashank.', None, None
            ),
            (
                'sup_102', 'usr_teacher_1', 'Dr. Vinsha Sumra', 'vinsha.sumra@mmdu.ac.in', '+91 98765 43210',
                'TEACHER', 'FEEDBACK', 'EXAMINATION',
                'Commendation & Preset Timer Suggestion for Lab Exams',
                'The automated marksheet calculations under UGC CBCS 10-point scale and the anti-cheating window switch monitors are working smoothly. Could we add a 60-minute quick-preset button in the exam wizard for end-semester laboratory exams?',
                'NORMAL', 'RESOLVED',
                'Approved. 60-minute quick preset added into exam creation step 1 by admin Vivek Kumar.', 'Vivek Kumar', '2026-09-02 18:30:00'
            ),
            (
                'sup_103', 'usr_student_amanpreet', 'Amanpreet Singh', 'amanpreet.singh@student.mmdu.ac.in', '+91 98120 44556',
                'STUDENT', 'EXAM_ISSUE', 'PROCTORING',
                'Proctoring Camera False Positive Explanation',
                'During my mid-semester test session, an alert was logged for ambient background acoustics due to construction work near my residence hall. I request the examiner to review the video audit recording.',
                'HIGH', 'IN_PROGRESS',
                'Audit video session reviewed. Background acoustics confirmed as external noise. Flag severity reduced.', 'Banda Shashank', None
            ),
            (
                'sup_104', None, 'Prof. Rajesh Sharma', 'r.sharma@nitk.ac.in', '+91 94111 22334',
                'GUEST', 'QUERY', 'GENERAL',
                'Inquiry regarding Cryptographic QR & SHA-256 Transcript Verification Protocol',
                'Greetings Examination Control Directorate, we are reviewing a transfer application and would like to confirm if the SHA-256 cryptographic verification seal on your digital transcripts can be verified directly via public API.',
                'NORMAL', 'OPEN',
                None, None, None
            )
        ])
        print("[DB-INIT] Initialized institutional support desk queries and feedback records.")

    conn.commit()
    conn.close()

# High-Performance In-Memory Static Cache with Gzip Compression & ETag Validation
_STATIC_CACHE = {}

def serve_static_file_optimized(handler, filepath, mime):
    """
    Ultra-fast static file server with in-memory caching, Gzip compression,
    and HTTP 304 Not Modified ETag validation.
    Reduces 700KB index.html payload to ~119KB (83% reduction).
    """
    try:
        mtime = os.path.getmtime(filepath)
        cache_key = (filepath, mtime)
        cached = _STATIC_CACHE.get(cache_key)
        if not cached:
            with open(filepath, 'rb') as f:
                raw_bytes = f.read()
            etag = f'"{hashlib.md5(raw_bytes).hexdigest()}"'
            gzipped_bytes = gzip.compress(raw_bytes, compresslevel=6) if len(raw_bytes) > 512 else None
            cached = {
                'raw': raw_bytes,
                'raw_len': str(len(raw_bytes)),
                'gzip': gzipped_bytes,
                'gzip_len': str(len(gzipped_bytes)) if gzipped_bytes else None,
                'etag': etag
            }
            _STATIC_CACHE[cache_key] = cached

        etag = cached['etag']
        if_none_match = handler.headers.get('If-None-Match', '').strip()
        if if_none_match == etag:
            handler.send_response(304)
            handler.send_header('ETag', etag)
            handler.send_header('Cache-Control', 'no-cache, must-revalidate')
            handler.send_header('Access-Control-Allow-Origin', '*')
            handler.end_headers()
            return

        accept_encoding = handler.headers.get('Accept-Encoding', '')
        use_gzip = bool(cached['gzip'] and 'gzip' in accept_encoding)

        handler.send_response(200)
        handler.send_header('Content-Type', mime)
        handler.send_header('ETag', etag)
        handler.send_header('Cache-Control', 'no-cache, must-revalidate')
        handler.send_header('Access-Control-Allow-Origin', '*')
        if use_gzip:
            handler.send_header('Content-Encoding', 'gzip')
            handler.send_header('Content-Length', cached['gzip_len'])
            handler.end_headers()
            handler.wfile.write(cached['gzip'])
        else:
            handler.send_header('Content-Length', cached['raw_len'])
            handler.end_headers()
            handler.wfile.write(cached['raw'])
    except Exception as ex:
        handler.send_json({"error": f"Failed to serve static file: {str(ex)}"}, 500)

class CredGenApiServer(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status_code=200):
        if isinstance(data, dict):
            # Strict security: NEVER leak OTP codes or dev bypasses in API responses
            data.pop("dev_otp", None)
            data.pop("otp_code", None)
            data.pop("email_otp", None)
            data.pop("phone_otp", None)

            if "success" in data and "ok" not in data:
                data["ok"] = data["success"]
            elif "ok" in data and "success" not in data:
                data["success"] = data["ok"]
            if status_code >= 400 and "error" not in data and "message" in data:
                data["error"] = data["message"]
            if "target" not in data and "identifier" in data:
                data["target"] = data["identifier"]
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Connection', 'close')
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode('utf-8'))

    def read_json_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode('utf-8')
        try:
            return json.loads(raw)
        except Exception:
            return {}

    # -------------------------------------------------------------
    # GET Endpoints Router
    # -------------------------------------------------------------
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 0. Static Web Assets & Single-Page Application Router (Port 5173 / 5000)
        if not path.startswith('/api/'):
            clean_path = path.lstrip('/')
            base_dir = os.path.dirname(os.path.abspath(__file__))
            if not clean_path or clean_path == '' or clean_path == 'index.html':
                filepath = os.path.join(base_dir, 'index.html')
            else:
                safe_rel = os.path.normpath(clean_path).lstrip(os.sep).lstrip('/')
                filepath = os.path.join(base_dir, safe_rel)

            if os.path.isfile(filepath):
                ext = os.path.splitext(filepath)[1].lower()
                if ext in ['.db', '.py', '.log', '.git', '.env']:
                    self.send_json({"error": "Access denied to protected file"}, 403)
                    return

                mime, _ = mimetypes.guess_type(filepath)
                if ext in ['.jsx', '.js']:
                    mime = 'application/javascript; charset=utf-8'
                elif ext == '.html':
                    mime = 'text/html; charset=utf-8'
                elif ext == '.css':
                    mime = 'text/css; charset=utf-8'
                elif not mime:
                    mime = 'application/octet-stream'

                serve_static_file_optimized(self, filepath, mime)
                return
            else:
                # SPA Fallback to index.html
                index_path = os.path.join(base_dir, 'index.html')
                if os.path.isfile(index_path):
                    serve_static_file_optimized(self, index_path, 'text/html; charset=utf-8')
                    return

        # 1b. Current Authenticated Session Inspection
        if path == '/api/auth/me':
            auth_header = self.headers.get('Authorization', '')
            session_token = self.headers.get('x-session-token', '')
            if auth_header.startswith('Bearer '):
                session_token = auth_header.split(' ', 1)[1].strip()
            elif not session_token and 'token' in query:
                session_token = query['token'][0]

            if not session_token:
                self.send_json({"success": False, "message": "Missing session authorization token."}, 401)
                return

            user = get_user_by_session(session_token)
            if not user:
                self.send_json({"success": False, "message": "Invalid or expired session. Please log in again."}, 401)
                return

            self.send_json({
                "success": True,
                "user": user,
                "token": session_token
            })
            return

        # 1. Health & Status
        if path == '/api/health':
            self.send_json({
                "status": "ONLINE",
                "service": "CredGen Enterprise Academic API & Web Application",
                "database": "SQLite3 (credgen.db)",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            })
            return

        # 2. Database Verification & Schema Integrity
        if path == '/api/db/verify':
            conn = get_db_connection()
            cur = conn.cursor()
            tables = {}
            for tbl in ['users', 'questions', 'exams', 'marksheets', 'proctor_sessions']:
                cur.execute(f"SELECT COUNT(*) as cnt FROM {tbl}")
                tables[tbl] = cur.fetchone()["cnt"]
            conn.close()

            self.send_json({
                "database_engine": "SQLite3 (WAL Mode Ready)",
                "status": "VERIFIED_OPERATIONAL",
                "table_counts": tables,
                "ugc_cbcs_rules_active": len(CBCS_GRADE_RULES),
                "verified_at": datetime.utcnow().isoformat() + "Z"
            })
            return

        # 3. Authoritative Users Management API
        if path == '/api/users':
            status_filter = query.get('status', ['ALL'])[0].upper()
            role_filter = query.get('role', ['ALL'])[0].upper()
            search_query = query.get('search', [''])[0].strip().lower()

            conn = get_db_connection()
            cur = conn.cursor()
            sql = """
            SELECT id, name, email, phone, role, department, institution, designation, 
                   roll_no, faculty_id, avatar, status, email_verified, phone_verified, 
                   rejection_reason, created_at
            FROM users WHERE 1=1
            """
            params = []
            if status_filter != 'ALL':
                sql += " AND status = ?"
                params.append(status_filter)
            if role_filter != 'ALL':
                if role_filter in ('TEACHER', 'FACULTY'):
                    sql += " AND role IN ('TEACHER', 'FACULTY')"
                elif role_filter in ('ADMIN', 'ADMINISTRATOR'):
                    sql += " AND role IN ('ADMIN', 'ADMINISTRATOR')"
                else:
                    sql += " AND role = ?"
                    params.append(role_filter)
            if search_query:
                sql += " AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ? OR roll_no LIKE ? OR LOWER(faculty_id) LIKE ?)"
                like_p = f"%{search_query}%"
                params.extend([like_p, like_p, like_p, like_p, like_p])

            sql += " ORDER BY role ASC, name ASC"
            cur.execute(sql, params)
            rows = [dict(r) for r in cur.fetchall()]
            conn.close()
            self.send_json({"success": True, "users": rows, "count": len(rows)})
            return

        # 3b. Registration Requests Endpoint (Faculty & Admin Pending Requests)
        if path == '/api/admin/registration-requests':
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("""
            SELECT id, name, email, phone, role, department, institution, designation, 
                   roll_no, faculty_id, status, email_verified, phone_verified, rejection_reason, created_at
            FROM users 
            WHERE status = 'PENDING' AND role IN ('TEACHER', 'FACULTY', 'ADMIN', 'ADMINISTRATOR')
            ORDER BY created_at DESC
            """)
            rows = [dict(r) for r in cur.fetchall()]
            conn.close()
            self.send_json({"success": True, "requests": rows, "count": len(rows)})
            return

        # 4. Question Bank
        if path == '/api/questions':
            course_id = query.get('course_id', ['ALL'])[0]
            q_type = query.get('type', ['ALL'])[0]
            search = query.get('search', [''])[0].strip().lower()

            conn = get_db_connection()
            cur = conn.cursor()
            sql = "SELECT * FROM questions WHERE 1=1"
            params = []

            if course_id != 'ALL':
                sql += " AND course_id = ?"
                params.append(course_id)
            if q_type != 'ALL':
                sql += " AND type = ?"
                params.append(q_type)
            if search:
                sql += " AND (LOWER(question_text) LIKE ? OR LOWER(topic) LIKE ? OR LOWER(unit) LIKE ?)"
                params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

            sql += " ORDER BY id ASC"
            cur.execute(sql, params)
            questions = []
            for r in cur.fetchall():
                q = dict(r)
                q["options"] = json.loads(q.get("options_json") or "[]")
                del q["options_json"]
                questions.append(q)
            conn.close()
            self.send_json({"success": True, "questions": questions, "count": len(questions)})
            return

        # 5. Examinations
        if path == '/api/exams':
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT * FROM exams ORDER BY created_at DESC")
            exams = []
            for r in cur.fetchall():
                e = dict(r)
                e["assignedBatches"] = json.loads(e.get("assigned_batches_json") or "[]")
                e["questionIds"] = json.loads(e.get("question_ids_json") or "[]")
                del e["assigned_batches_json"]
                del e["question_ids_json"]
                exams.append(e)
            conn.close()
            self.send_json({"success": True, "exams": exams, "count": len(exams)})
            return

        # 6. Marksheets & Transcripts
        if path == '/api/marksheets' or path.startswith('/api/marksheets/'):
            specific_id = path.split('/')[3] if (path.startswith('/api/marksheets/') and len(path.split('/')) > 3 and path.split('/')[3] != 'publish') else None
            roll_no = query.get('roll_no', [None])[0]
            student_id = query.get('student_id', [None])[0]

            conn = get_db_connection()
            cur = conn.cursor()
            if specific_id:
                cur.execute("SELECT * FROM marksheets WHERE id = ? OR student_id = ? OR roll_no = ?", (specific_id, specific_id, specific_id))
            elif roll_no:
                cur.execute("SELECT * FROM marksheets WHERE roll_no = ?", (roll_no,))
            elif student_id:
                cur.execute("SELECT * FROM marksheets WHERE student_id = ?", (student_id,))
            else:
                cur.execute("SELECT * FROM marksheets ORDER BY roll_no ASC")
            records = []
            for r in cur.fetchall():
                m = dict(r)
                m["courses"] = json.loads(m.get("courses_json") or "[]")
                del m["courses_json"]
                records.append(m)
            conn.close()

            if specific_id and records:
                self.send_json({"success": True, "marksheet": records[0]})
            elif specific_id and not records:
                self.send_json({"success": False, "message": "Marksheet record not found."}, 404)
            else:
                self.send_json({"success": True, "marksheets": records, "count": len(records)})
            return

        # 7. Proctoring Sessions
        if path == '/api/proctoring/sessions':
            status_filter = query.get('archive_status', ['ACTIVE'])[0]
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT * FROM proctor_sessions WHERE archive_status = ? ORDER BY risk_score DESC", (status_filter,))
            sessions = []
            for r in cur.fetchall():
                s = dict(r)
                s["anomalyFlags"] = json.loads(s.get("anomaly_flags_json") or "[]")
                del s["anomaly_flags_json"]
                sessions.append(s)
            conn.close()
            self.send_json({"success": True, "sessions": sessions, "count": len(sessions)})
            return

        # 8. Support Desk Queries, Feedback & Grievances
        if path == '/api/support' or path == '/api/support/queries':
            status_filter = query.get('status', [None])[0]
            role_filter = query.get('role', [None])[0]
            type_filter = query.get('type', [None])[0]
            category_filter = query.get('category', [None])[0]

            conn = get_db_connection()
            cur = conn.cursor()
            sql = "SELECT * FROM support_queries WHERE 1=1"
            params = []
            if status_filter:
                sql += " AND UPPER(status) = ?"
                params.append(status_filter.upper())
            if role_filter:
                sql += " AND UPPER(role) = ?"
                params.append(role_filter.upper())
            if type_filter:
                sql += " AND UPPER(type) = ?"
                params.append(type_filter.upper())
            if category_filter:
                sql += " AND UPPER(category) = ?"
                params.append(category_filter.upper())

            sql += " ORDER BY CASE priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END, created_at DESC"
            cur.execute(sql, params)
            records = [dict(r) for r in cur.fetchall()]
            conn.close()
            self.send_json({"success": True, "queries": records, "count": len(records)})
            return

        if path.startswith('/api/support/'):
            ticket_id = path.split('/')[3]
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT * FROM support_queries WHERE id = ?", (ticket_id,))
            row = cur.fetchone()
            conn.close()
            if row:
                self.send_json({"success": True, "query": dict(row)})
            else:
                self.send_json({"success": False, "message": "Support query not found."}, 404)
            return

        self.send_json({"error": "Endpoint not found", "path": path}, 404)

    # -------------------------------------------------------------
    # POST Endpoints Router
    # -------------------------------------------------------------
    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()

        # 0. Password Recovery Account Discovery & Verification (Zero Leakage)
        if path == '/api/auth/recovery/identify' or path == '/api/auth/recovery/lookup':
            identifier = (body.get('identifier') or body.get('email') or body.get('phone') or '').strip()
            if not identifier:
                self.send_json({"success": False, "message": "Identifier is required."}, 400)
                return

            conn = get_db_connection()
            cur = conn.cursor()
            u = find_user_by_identifier(cur, identifier, only_active=True)
            conn.close()

            if not u:
                self.send_json({"success": False, "message": f"No active account found for identifier '{identifier}'."}, 404)
                return

            email = u.get("email") or ""
            phone = u.get("phone") or ""
            masked_email = ""
            if email and "@" in email:
                p_user, p_domain = email.split("@", 1)
                masked_email = f"{p_user[0]}***{p_user[-1] if len(p_user) > 1 else ''}@{p_domain}"
            masked_phone = ""
            if phone:
                clean_p = phone.replace(" ", "").replace("-", "")
                masked_phone = f"{clean_p[:2]}******{clean_p[-4:]}" if len(clean_p) >= 10 else f"***{clean_p[-2:]}"

            self.send_json({
                "success": True,
                "found": True,
                "user": {
                    "id": u["id"],
                    "name": u["name"],
                    "role": u["role"],
                    "department": u.get("department", ""),
                    "masked_email": masked_email,
                    "masked_phone": masked_phone
                },
                "masked_email": masked_email,
                "masked_phone": masked_phone
            })
            return

        # 1. Real OTP Generation & External Dispatch (Password Recovery & Identity Verification)
        if path == '/api/auth/send-otp' or path == '/api/auth/send-real-otp' or path == '/api/send-real-otp':
            identifier = (body.get('identifier') or body.get('email') or body.get('phone') or '').strip()
            channel = (body.get('channel') or 'EMAIL').upper()
            purpose = (body.get('purpose') or 'FORGOT_PASSWORD').upper()

            if not identifier:
                self.send_json({"success": False, "message": "Please enter your registered institutional email, mobile number, roll number, or faculty ID."}, 400)
                return

            client_ip = self.client_address[0] if self.client_address else '127.0.0.1'

            conn = get_db_connection()
            cur = conn.cursor()

            # Find active user account across roll number, faculty ID, email, and mobile
            u = find_user_by_identifier(cur, identifier)

            if not u:
                conn.close()
                self.send_json({"success": False, "message": f"No active account found for identifier '{identifier}'. Please verify your credentials."}, 404)
                return

            canonical_ident = u.get("email") or u.get("phone") or u["id"]

            # Rate Limiting: Max 3 requests per 10 minutes per identifier
            cur.execute("""
            SELECT COUNT(*) as cnt FROM otps 
            WHERE (identifier = ? OR identifier = ?) AND created_at > datetime('now', '-10 minutes')
            """, (canonical_ident, u["id"]))
            if cur.fetchone()["cnt"] >= 3:
                conn.close()
                self.send_json({"success": False, "message": "Too many verification requests. Please wait 10 minutes before requesting a new code."}, 429)
                return

            # Secure random 6-digit numeric OTP
            raw_otp = f"{secrets.randbelow(900000) + 100000}"
            secure_hash = hash_otp(canonical_ident, raw_otp)

            # If user selected SMS and Twilio is configured, dispatch SMS;
            # Otherwise (or if SMS is unconfigured), dispatch to registered Gmail / Email address
            has_twilio = bool(os.environ.get("TWILIO_ACCOUNT_SID") and os.environ.get("TWILIO_AUTH_TOKEN"))
            if channel == 'SMS' and has_twilio and u.get('phone'):
                dest_target = u['phone']
                clean_p = dest_target.replace(' ', '')
                masked_target = f"{clean_p[:5]}*****{clean_p[-3:]}" if len(clean_p) >= 8 else dest_target
                sent_ok, provider_msg = send_real_sms_otp(dest_target, raw_otp)
                delivery_channel_used = 'SMS'
            else:
                if not u.get('email'):
                    conn.close()
                    self.send_json({"success": False, "message": "This account does not have a registered Gmail / institutional email address on file. Please contact your administrator."}, 400)
                    return
                dest_target = u['email']
                parts = dest_target.split('@')
                if len(parts) == 2:
                    name_p, dom_p = parts
                    masked_target = f"{name_p[0]}***{name_p[-1] if len(name_p) > 1 else ''}@{dom_p}"
                else:
                    masked_target = dest_target
                sent_ok, provider_msg = send_real_email_otp(dest_target, u['name'], raw_otp)
                delivery_channel_used = 'EMAIL'

            # Rule 12: If provider is not configured, DO NOT fake delivery and DO NOT display OTP!
            if not sent_ok:
                conn.close()
                self.send_json({
                    "success": False,
                    "message": provider_msg,
                    "provider_configured": False
                }, 503)
                return

            # Invalidate previous unverified OTPs for this account
            cur.execute("UPDATE otps SET verified = 2 WHERE identifier = ? AND verified = 0", (canonical_ident,))

            # Store ONLY the salted cryptographic hash with 10-minute expiry (Plaintext OTP is NEVER stored)
            cur.execute("""
            INSERT INTO otps (identifier, otp_hash, otp_code, purpose, attempts, verified, expires_at)
            VALUES (?, ?, '', ?, 0, 0, datetime('now', '+10 minutes'))
            """, (canonical_ident, secure_hash, purpose))
            conn.commit()
            conn.close()

            # Safe audit log (Zero passwords, Zero OTPs)
            print(f"[AUTH-OTP] Security OTP dispatched via {delivery_channel_used} to {masked_target} (Valid 10 mins)")

            # Return success WITHOUT the OTP
            self.send_json({
                "success": True,
                "message": f"A 6-digit verification code has been dispatched to your registered Gmail / Email ({masked_target}).",
                "target": masked_target,
                "expires_in": 600
            })
            return

        # 2. OTP Verification & Reset Token Issuance
        if path == '/api/auth/verify-otp' or path == '/api/verify-otp':
            identifier = (body.get('identifier') or '').strip()
            otp_code = str(body.get('otp_code') or body.get('otp') or '').strip()
            purpose = (body.get('purpose') or 'FORGOT_PASSWORD').upper()

            if not identifier or not otp_code:
                self.send_json({"success": False, "message": "Identifier and 6-digit verification code are required."}, 400)
                return

            if len(otp_code) != 6 or not otp_code.isdigit():
                self.send_json({"success": False, "message": "Verification code must be exactly 6 digits."}, 400)
                return

            conn = get_db_connection()
            cur = conn.cursor()

            # Find canonical account
            u_row = find_user_by_identifier(cur, identifier)
            canonical_ident = u_row["email"] if (u_row and u_row.get("email")) else (u_row["phone"] if (u_row and u_row.get("phone")) else identifier)
            user_id = u_row["id"] if u_row else ""

            # Find active OTP record
            cur.execute("""
            SELECT * FROM otps 
            WHERE (identifier = ? OR identifier = ? OR identifier = ?)
              AND purpose = ? AND verified = 0 AND expires_at > datetime('now')
            ORDER BY id DESC LIMIT 1
            """, (identifier, canonical_ident, user_id, purpose))
            otp_record = cur.fetchone()

            if not otp_record:
                conn.close()
                self.send_json({"success": False, "message": "No active verification code found or code has expired (10-minute limit). Please request a new code."}, 400)
                return

            # Check attempt limit (Max 5 attempts)
            if otp_record["attempts"] >= 5:
                cur.execute("UPDATE otps SET verified = 2 WHERE id = ?", (otp_record["id"],))
                conn.commit()
                conn.close()
                self.send_json({"success": False, "message": "Maximum verification attempts exceeded. Code has been locked for security. Please request a new code."}, 429)
                return

            # Secure constant-time hash comparison
            expected_hash = otp_record["otp_hash"]
            computed_hash = hash_otp(otp_record["identifier"], otp_code)

            if not expected_hash or not secrets.compare_digest(expected_hash, computed_hash):
                new_attempts = otp_record["attempts"] + 1
                cur.execute("UPDATE otps SET attempts = ? WHERE id = ?", (new_attempts, otp_record["id"]))
                conn.commit()
                conn.close()
                remaining = max(0, 5 - new_attempts)
                self.send_json({
                    "success": False,
                    "message": f"Incorrect verification code. Attempts remaining: {remaining}."
                }, 400)
                return

            # Verification Successful -> Issue one-time 24-byte cryptographically random reset token (15-min TTL)
            reset_token = secrets.token_hex(24)
            cur.execute("""
            UPDATE otps 
            SET verified = 1, reset_token = ?, expires_at = datetime('now', '+15 minutes')
            WHERE id = ?
            """, (reset_token, otp_record["id"]))
            conn.commit()
            conn.close()

            print(f"[AUTH-OTP] Verified identity for {canonical_ident}. Issued single-use reset authorization token.")
            self.send_json({
                "success": True,
                "message": "Identity verified successfully. You may now set your new confidential password.",
                "reset_token": reset_token,
                "identifier": canonical_ident
            })
            return

        # 3. Set New Password via Verified Reset Token
        if path == '/api/auth/reset-password':
            identifier = (body.get('identifier') or '').strip()
            reset_token = (body.get('reset_token') or '').strip()
            new_password = (body.get('new_password') or body.get('password') or '').strip()

            if not reset_token or not new_password:
                self.send_json({"success": False, "message": "Reset authorization token and new password are required."}, 400)
                return

            if len(new_password) < 8:
                self.send_json({"success": False, "message": "Password must be at least 8 characters long."}, 400)
                return

            conn = get_db_connection()
            cur = conn.cursor()

            # Lookup valid OTP authorization token
            cur.execute("""
            SELECT * FROM otps 
            WHERE reset_token = ? AND verified = 1 AND expires_at > datetime('now')
            ORDER BY id DESC LIMIT 1
            """, (reset_token,))
            valid_otp = cur.fetchone()

            if not valid_otp:
                conn.close()
                self.send_json({"success": False, "message": "Invalid or expired password reset authorization. Please restart recovery."}, 401)
                return

            # Lookup target user account across all identifier fields
            user_ident = identifier or valid_otp['identifier']
            target_user = find_user_by_identifier(cur, user_ident)
            if not target_user and valid_otp.get('identifier'):
                target_user = find_user_by_identifier(cur, valid_otp['identifier'])

            if not target_user:
                conn.close()
                self.send_json({"success": False, "message": "User account associated with this reset token could not be found."}, 404)
                return

            hashed_pass = hash_password(new_password)
            cur.execute("UPDATE users SET password = ? WHERE id = ?", (hashed_pass, target_user['id']))

            # Invalidate reset token to prevent reuse
            cur.execute("UPDATE otps SET reset_token = NULL, verified = 2 WHERE id = ?", (valid_otp["id"],))

            # Revoke all existing sessions for this user
            cur.execute("DELETE FROM sessions WHERE user_id = ?", (target_user['id'],))
            conn.commit()
            conn.close()

            print(f"[AUTH-RESET] Password successfully updated for user {target_user['id']}. All sessions revoked.")
            self.send_json({
                "success": True,
                "message": "Account password updated securely. All previous active sessions have been invalidated. Please sign in."
            })
            return

        # 3. User Login (PBKDF2 Hash Verification, Auto-Upgrade & Session Issuance)
        if path == '/api/auth/login':
            identifier = body.get('identifier', '').strip()
            password = body.get('password', '').strip()
            role = body.get('role')
            if role:
                role = role.upper()

            if not identifier or not password:
                self.send_json({"success": False, "message": "Identifier and password are required."}, 400)
                return

            conn = get_db_connection()
            cur = conn.cursor()
            
            user_row = find_user_by_identifier(cur, identifier, only_active=False)

            if not user_row:
                conn.close()
                self.send_json({"success": False, "message": "No account found with the provided identifier. Please verify your credentials or register."}, 401)
                return

            u = dict(user_row)

            # Strict Status Verification
            if u.get("status") == "PENDING":
                conn.close()
                self.send_json({
                    "success": False,
                    "message": "Account pending administrator approval. Your application has been submitted and is awaiting activation by Administrator Vivek."
                }, 403)
                return

            if u.get("status") == "REJECTED":
                reason = u.get("rejection_reason") or "Application was declined by the administrator."
                conn.close()
                self.send_json({
                    "success": False,
                    "message": f"Account registration request was rejected by the administrator. ({reason})"
                }, 403)
                return

            if u.get("status") == "ARCHIVED":
                conn.close()
                self.send_json({
                    "success": False,
                    "message": "This institutional account has been deactivated. Please contact Administrator Vivek."
                }, 403)
                return

            if u.get("status") != "ACTIVE":
                conn.close()
                self.send_json({"success": False, "message": "Account is not in active status."}, 403)
                return

            # Password verification with transparent auto-upgrade to PBKDF2
            is_valid, needs_upgrade = verify_and_upgrade_password(password, u["password"])
            if not is_valid:
                conn.close()
                self.send_json({"success": False, "message": f"Authentication failed: Incorrect password entered for {u['name']}."}, 401)
                return

            if needs_upgrade:
                new_hashed = hash_password(password)
                cur.execute("UPDATE users SET password = ? WHERE id = ?", (new_hashed, u["id"]))
                conn.commit()
                print(f"[AUTH-UPGRADE] Transparently upgraded password to PBKDF2 hash for user: {u['id']}")

            # Create session token
            session_token = generate_session_token()
            ip_addr = self.client_address[0] if self.client_address else ''
            ua = self.headers.get('User-Agent', '')
            cur.execute("""
            INSERT INTO sessions (token, user_id, expires_at, ip_address, user_agent)
            VALUES (?, ?, datetime('now', '+7 days'), ?, ?)
            """, (session_token, u["id"], ip_addr, ua))
            conn.commit()
            conn.close()

            del u["password"]
            print(f"[AUTH-LOGIN] Session authenticated for {u['name']} ({u['role']}) [Token: {session_token[:8]}...]")
            self.send_json({
                "success": True,
                "message": f"Welcome back, {u['name']}.",
                "token": session_token,
                "user": u
            })
            return

        # 3b. User Logout (Session Revocation)
        if path == '/api/auth/logout':
            auth_header = self.headers.get('Authorization', '')
            session_token = self.headers.get('x-session-token', '')
            if auth_header.startswith('Bearer '):
                session_token = auth_header.split(' ', 1)[1].strip()
            elif body and body.get('token'):
                session_token = body.get('token')

            if session_token:
                conn = get_db_connection()
                cur = conn.cursor()
                cur.execute("DELETE FROM sessions WHERE token = ?", (session_token,))
                conn.commit()
                conn.close()
                print(f"[AUTH-LOGOUT] Revoked session: {session_token[:8]}...")

            self.send_json({"success": True, "message": "Signed out safely."})
            return

                # -------------------------------------------------------------
        # Registration Contact Verification: Send OTP
        # -------------------------------------------------------------
        if path == '/api/auth/register/send-otp':
            ident = (body.get('identifier') or body.get('email') or body.get('phone') or '').strip()
            channel = (body.get('channel') or 'EMAIL').upper()
            purpose = (body.get('purpose') or ('REG_EMAIL_VERIFY' if channel == 'EMAIL' else 'REG_PHONE_VERIFY')).upper()
            target_name = body.get('name') or 'Candidate'

            if not ident:
                self.send_json({"success": False, "message": "Email address or mobile number is required."}, 400)
                return

            conn = get_db_connection()
            cur = conn.cursor()

            # Check if active account already exists with this contact
            cur.execute("SELECT id, status FROM users WHERE (LOWER(email) = LOWER(?) OR phone = ?)", (ident, ident))
            existing = cur.fetchone()
            if existing and existing['status'] == 'ACTIVE':
                conn.close()
                self.send_json({"success": False, "message": "An active account with this email or mobile already exists. Please sign in instead."}, 409)
                return

            # Rate limiting: max 3 requests per 10 minutes
            cur.execute("SELECT COUNT(*) as cnt FROM otps WHERE identifier = ? AND created_at > datetime('now', '-10 minutes')", (ident,))
            if cur.fetchone()["cnt"] >= 3:
                conn.close()
                self.send_json({"success": False, "message": "Too many verification requests. Please wait 10 minutes before requesting a new code."}, 429)
                return

            raw_otp = f"{secrets.randbelow(900000) + 100000}"
            secure_hash = hash_otp(ident, raw_otp)

            if channel == 'SMS':
                clean_p = ident.replace(' ', '')
                masked_target = f"{clean_p[:5]}*****{clean_p[-3:]}" if len(clean_p) >= 8 else clean_p
                sent_ok, provider_msg = send_real_sms_otp(ident, raw_otp)
            else:
                parts = ident.split('@')
                masked_target = f"{parts[0][0]}***@{parts[1]}" if len(parts) == 2 else ident
                sent_ok, provider_msg = send_real_email_otp(ident, target_name, raw_otp)

            if not sent_ok:
                conn.close()
                self.send_json({"success": False, "message": provider_msg, "provider_configured": False}, 503)
                return

            cur.execute("UPDATE otps SET verified = 2 WHERE identifier = ? AND purpose = ?", (ident, purpose))
            cur.execute("""
            INSERT INTO otps (identifier, otp_hash, otp_code, purpose, attempts, verified, expires_at)
            VALUES (?, ?, '', ?, 0, 0, datetime('now', '+10 minutes'))
            """, (ident, secure_hash, purpose))
            conn.commit()
            conn.close()

            print(f"[AUTH-REG-OTP] Dispatched {channel} registration verification code to {masked_target}")
            self.send_json({
                "success": True,
                "message": f"Verification code dispatched to {masked_target}.",
                "target": masked_target,
                "expires_in": 600
            })
            return

        # -------------------------------------------------------------
        # Registration Contact Verification: Verify OTP
        # -------------------------------------------------------------
        if path == '/api/auth/register/verify-otp':
            ident = (body.get('identifier') or '').strip()
            otp_code = str(body.get('otp_code') or body.get('otp') or '').strip()
            purpose = (body.get('purpose') or 'REG_EMAIL_VERIFY').upper()

            if not ident or not otp_code or len(otp_code) != 6:
                self.send_json({"success": False, "message": "Identifier and 6-digit verification code are required."}, 400)
                return

            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("""
            SELECT * FROM otps WHERE identifier = ? AND purpose = ? AND verified = 0 AND expires_at > datetime('now')
            ORDER BY id DESC LIMIT 1
            """, (ident, purpose))
            rec = cur.fetchone()
            if not rec:
                conn.close()
                self.send_json({"success": False, "message": "No active verification code found or code has expired. Please request a new code."}, 400)
                return

            if rec["attempts"] >= 5:
                cur.execute("UPDATE otps SET verified = 2 WHERE id = ?", (rec["id"],))
                conn.commit()
                conn.close()
                self.send_json({"success": False, "message": "Maximum verification attempts exceeded. Code has been locked for security."}, 429)
                return

            expected_hash = rec["otp_hash"]
            computed_hash = hash_otp(rec["identifier"], otp_code)
            if not expected_hash or not secrets.compare_digest(expected_hash, computed_hash):
                new_att = rec["attempts"] + 1
                cur.execute("UPDATE otps SET attempts = ? WHERE id = ?", (new_att, rec["id"]))
                conn.commit()
                conn.close()
                self.send_json({"success": False, "message": f"Incorrect verification code. Attempts remaining: {max(0, 5 - new_att)}."}, 400)
                return

            # Verified! Issue verification token
            v_token = secrets.token_hex(24)
            cur.execute("UPDATE otps SET verified = 1, reset_token = ? WHERE id = ?", (v_token, rec["id"]))
            conn.commit()
            conn.close()

            self.send_json({
                "success": True,
                "message": "Contact information verified successfully.",
                "verification_token": v_token
            })
            return

        # -------------------------------------------------------------
        # Admin Registration Requests: Approve
        # -------------------------------------------------------------
        if path.startswith('/api/admin/registration-requests/') and path.endswith('/approve'):
            target_id = path[len('/api/admin/registration-requests/'):-len('/approve')].strip('/')
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, name, role, email, status FROM users WHERE id = ?", (target_id,))
            target = cur.fetchone()
            if not target:
                conn.close()
                self.send_json({"success": False, "message": "Target user registration not found."}, 404)
                return

            cur.execute("UPDATE users SET status = 'ACTIVE' WHERE id = ?", (target_id,))
            conn.commit()
            conn.close()

            print(f"[AUTH-ADMIN] Administrator approved {target['role']} account for {target['name']} ({target['id']})")
            self.send_json({
                "success": True,
                "message": f"Account for {target['name']} ({target['role']}) has been successfully approved and activated.",
                "user_id": target_id
            })
            return

        # -------------------------------------------------------------
        # Admin Registration Requests: Reject
        # -------------------------------------------------------------
        if path.startswith('/api/admin/registration-requests/') and path.endswith('/reject'):
            target_id = path[len('/api/admin/registration-requests/'):-len('/reject')].strip('/')
            reason = (body.get('reason') or 'Institutional application declined by administrator.').strip()
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT id, name, role, email FROM users WHERE id = ?", (target_id,))
            target = cur.fetchone()
            if not target:
                conn.close()
                self.send_json({"success": False, "message": "Target user registration not found."}, 404)
                return

            cur.execute("UPDATE users SET status = 'REJECTED', rejection_reason = ? WHERE id = ?", (reason, target_id))
            conn.commit()
            conn.close()

            print(f"[AUTH-ADMIN] Administrator rejected {target['role']} account for {target['name']} ({target['id']})")
            self.send_json({
                "success": True,
                "message": f"Registration request for {target['name']} has been rejected.",
                "user_id": target_id
            })
            return

        # -------------------------------------------------------------
        # Admin User Management: Update Email/Mobile/Details
        # -------------------------------------------------------------
        if path.startswith('/api/users/') and (path.endswith('/update') or self.command == 'PUT'):
            target_id = path.split('/')[3]
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT * FROM users WHERE id = ?", (target_id,))
            existing_user = cur.fetchone()
            if not existing_user:
                conn.close()
                self.send_json({"success": False, "message": "User not found."}, 404)
                return

            u_name = (body.get('name') or existing_user['name']).strip()
            u_email = (body.get('email') or existing_user['email']).strip().lower()
            u_phone = (body.get('phone') or existing_user['phone']).strip()
            u_roll = (body.get('roll_no') or body.get('rollNo') or existing_user['roll_no'])
            u_fac = (body.get('faculty_id') or body.get('facultyId') or existing_user['faculty_id'])
            u_dept = (body.get('department') or existing_user['department'])
            u_desig = (body.get('designation') or existing_user['designation'])
            u_status = (body.get('status') or existing_user['status']).upper()

            # Check duplicate email if changed
            if u_email != existing_user['email'].lower():
                cur.execute("SELECT id FROM users WHERE LOWER(email) = ? AND id != ?", (u_email, target_id))
                if cur.fetchone():
                    conn.close()
                    self.send_json({"success": False, "message": f"Email '{u_email}' is already registered to another account."}, 409)
                    return

            cur.execute("""
            UPDATE users SET
                name = ?, email = ?, phone = ?, roll_no = ?, faculty_id = ?,
                department = ?, designation = ?, status = ?
            WHERE id = ?
            """, (u_name, u_email, u_phone, u_roll, u_fac, u_dept, u_desig, u_status, target_id))
            conn.commit()

            cur.execute("SELECT id, name, email, phone, role, department, institution, designation, roll_no, faculty_id, avatar, status, created_at FROM users WHERE id = ?", (target_id,))
            updated_row = dict(cur.fetchone())
            conn.close()

            print(f"[AUTH-ADMIN] Updated user record: {updated_row['name']} ({updated_row['id']})")
            self.send_json({
                "success": True,
                "message": f"Account details for {updated_row['name']} updated successfully.",
                "user": updated_row
            })
            return

        # -------------------------------------------------------------
        # Admin User Management: Deactivate / Archive
        # -------------------------------------------------------------
        if path.startswith('/api/users/') and path.endswith('/archive'):
            target_id = path[len('/api/users/'):-len('/archive')].strip('/')
            if target_id == 'usr_admin_vivek':
                self.send_json({"success": False, "message": "Chief Administrator (Vivek) cannot be deactivated."}, 403)
                return

            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("UPDATE users SET status = 'ARCHIVED' WHERE id = ?", (target_id,))
            conn.commit()
            conn.close()
            self.send_json({"success": True, "message": "Account deactivated/archived."})
            return

        # -------------------------------------------------------------
        # Admin User Management: Restore Active
        # -------------------------------------------------------------
        if path.startswith('/api/users/') and path.endswith('/restore'):
            target_id = path[len('/api/users/'):-len('/restore')].strip('/')
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("UPDATE users SET status = 'ACTIVE' WHERE id = ?", (target_id,))
            conn.commit()
            conn.close()
            self.send_json({"success": True, "message": "Account restored to ACTIVE."})
            return

        # 3c. User Registration (with PBKDF2 Hashing & Session Issuance)
        if path == '/api/auth/register':
            name = body.get('name', '').strip()
            email = body.get('email', '').strip().lower()
            phone = body.get('phone', '').strip()
            password = body.get('password', '').strip()
            role = body.get('role', 'STUDENT').upper()
            department = body.get('department', 'Computer Science & Engineering').strip()
            institution = body.get('institution', 'Maharishi Markandeshwar (Deemed to be University), Mullana').strip()
            roll_no = (body.get('rollNumber') or body.get('roll_number') or body.get('rollNo') or body.get('roll_no') or body.get('roll') or body.get('identifier') or '').strip() or None
            faculty_id = (body.get('facultyId') or body.get('faculty_id') or body.get('employeeId') or body.get('employee_id') or body.get('faculty_code') or '').strip() or None

            if not name or not email or not password:
                self.send_json({"success": False, "message": "Full legal name, email address, and password are required."}, 400)
                return

            if len(password) < 8:
                self.send_json({"success": False, "message": "Password must be at least 8 characters long."}, 400)
                return

            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,))
            if cur.fetchone():
                conn.close()
                self.send_json({"success": False, "message": f"An account with email '{email}' already exists."}, 409)
                return

            if roll_no:
                cur.execute("SELECT id FROM users WHERE roll_no = ?", (roll_no,))
                if cur.fetchone():
                    conn.close()
                    self.send_json({"success": False, "message": f"An account with Roll Number '{roll_no}' already exists."}, 409)
                    return

            user_id = f"usr_{role.lower()}_{int(time.time())}_{secrets.randbelow(900) + 100}"
            designation = 'Student Candidate' if role == 'STUDENT' else ('Faculty Member' if role == 'TEACHER' else 'Department Administrator')
            hashed_pwd = hash_password(password)

            # Role & Status Specification:
            # - Students: ACTIVE immediately (No admin approval required)
            # - Faculty: PENDING (Requires Admin Vivek approval)
            # - Administrators: PENDING (Requires current Active Admin approval)
            clean_role = role.upper()
            if clean_role in ('TEACHER', 'FACULTY'):
                initial_status = 'PENDING'
                role_key = 'TEACHER'
                success_msg = f"Registration submitted. Your Faculty account for {name} is pending review and approval by Administrator Vivek."
            elif clean_role in ('ADMIN', 'ADMINISTRATOR'):
                initial_status = 'PENDING'
                role_key = 'ADMIN'
                success_msg = f"Registration submitted. Your Administrator account for {name} is pending review and approval by Administrator Vivek."
            else:
                initial_status = 'ACTIVE'
                role_key = 'STUDENT'
                success_msg = f"Student account registered successfully. Welcome to CredGen, {name}."

            cur.execute("""
            INSERT INTO users (id, name, email, phone, password, role, department, institution, designation, roll_no, faculty_id, avatar, status, email_verified, phone_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, 1, 1)
            """, (user_id, name, email, phone, hashed_pwd, role_key, department, institution, designation, roll_no, faculty_id, initial_status))
            conn.commit()

            cur.execute("SELECT id, name, email, phone, role, department, institution, designation, roll_no, faculty_id, avatar, status, created_at FROM users WHERE id = ?", (user_id,))
            new_user = dict(cur.fetchone())

            # Issue session token ONLY for active accounts (Students)
            session_token = None
            if initial_status == 'ACTIVE':
                session_token = generate_session_token()
                ip_addr = self.client_address[0] if self.client_address else ''
                ua = self.headers.get('User-Agent', '')
                cur.execute("""
                INSERT INTO sessions (token, user_id, expires_at, ip_address, user_agent)
                VALUES (?, ?, datetime('now', '+7 days'), ?, ?)
                """, (session_token, user_id, ip_addr, ua))
                conn.commit()

            conn.close()

            print(f"[AUTH-REGISTER] Created new {role_key} user: {name} ({email}) [ID: {user_id}, Status: {initial_status}]")
            self.send_json({
                "success": True,
                "message": success_msg,
                "token": session_token,
                "user": new_user,
                "pending": (initial_status == 'PENDING')
            }, 201)
            return

        # 3c. AI Academic Performance Insights Engine
        if path == '/api/ai/performance-insights':
            student_name = body.get('studentName', 'Student Candidate')
            roll_no = body.get('rollNo', '11242601')
            courses = body.get('courses', [])

            if not courses:
                courses = [
                    {"code": "CS-306", "title": "Java Programming", "credits": 4.0, "total": 86.0, "letterGrade": "A+", "gradePoint": 9},
                    {"code": "CS-308", "title": "Cloud Computing", "credits": 4.0, "total": 82.0, "letterGrade": "A+", "gradePoint": 9},
                    {"code": "CS-302", "title": "Database Management Systems", "credits": 4.0, "total": 85.0, "letterGrade": "A+", "gradePoint": 9},
                    {"code": "CS-304", "title": "Design & Analysis of Algorithms", "credits": 4.0, "total": 76.0, "letterGrade": "A", "gradePoint": 8},
                    {"code": "CS-310", "title": "Big Data Analytics", "credits": 4.0, "total": 64.0, "letterGrade": "B+", "gradePoint": 7},
                    {"code": "CS-312", "title": "Software Project Management", "credits": 4.0, "total": 68.0, "letterGrade": "B+", "gradePoint": 7}
                ]

            scored = []
            total_marks = 0.0
            total_cr = 0.0
            total_cp = 0.0
            for c in courses:
                cr = float(c.get('credits') or c.get('credit') or 4.0)
                tot = float(c.get('total') or c.get('marks') or c.get('score') or c.get('percentage') or 75.0)
                gp = float(c.get('gradePoint') or c.get('grade_point') or 8.0)
                title = c.get('title') or c.get('name') or c.get('courseName') or c.get('code') or 'Subject'
                letter_grade = c.get('letterGrade') or c.get('grade') or ('O' if tot>=90 else 'A+' if tot>=80 else 'A' if tot>=70 else 'B+' if tot>=60 else 'B' if tot>=50 else 'P')
                scored.append({
                    "code": c.get('code', ''),
                    "title": title,
                    "credits": cr,
                    "marks": tot,
                    "percentage": round(tot, 1),
                    "grade": letter_grade,
                    "gradePoint": gp
                })
                total_marks += tot
                total_cr += cr
                total_cp += (cr * gp)

            avg_pct = round(total_marks / len(scored), 1) if scored else 78.0
            sgpa = round(total_cp / total_cr, 2) if total_cr > 0 else 8.0

            scored.sort(key=lambda x: x["percentage"], reverse=True)
            strengths = [c for c in scored if c["percentage"] >= 75.0] or scored[:2]
            weaknesses = [c for c in scored if c["percentage"] < 75.0] or scored[-2:]

            weak_names = [w["title"] for w in weaknesses]
            strong_names = [s["title"] for s in strengths]
            weak_str = " and ".join(weak_names) if weak_names else "Core Electives"
            strong_str = " and ".join(strong_names[:2]) if strong_names else "Core Programming Domains"

            overall_desc = "Good performance"
            if avg_pct >= 90:
                overall_desc = "Outstanding performance"
            elif avg_pct >= 80:
                overall_desc = "Excellent performance"
            elif avg_pct >= 70:
                overall_desc = "Good performance"
            elif avg_pct >= 60:
                overall_desc = "Above Average performance"

            recommendation = (
                f"Focus on {weak_str} concepts, particularly distributed storage and processing. "
                f"Maintaining your current performance in {strong_str} should be a priority."
            )

            res_payload = {
                "success": True,
                "studentName": student_name,
                "rollNo": roll_no,
                "overallSummary": f"Overall: {overall_desc} — {avg_pct}%.",
                "overallPercentage": avg_pct,
                "sgpa": sgpa,
                "totalCredits": total_cr,
                "strengths": [
                    {"title": s["title"], "code": s["code"], "percentage": s["percentage"], "grade": s["grade"]}
                    for s in strengths
                ],
                "areasForImprovement": [
                    {"title": w["title"], "code": w["code"], "percentage": w["percentage"], "grade": w["grade"]}
                    for w in weaknesses
                ],
                "recommendation": recommendation,
                "actionPlan": [
                    f"Focus on {weak_names[0] if weak_names else 'developing areas'} concepts, particularly distributed storage and processing.",
                    f"Practice model question sets and architectural diagrams in {weak_names[1] if len(weak_names) > 1 else 'core technical subjects'}.",
                    f"Maintaining high marks in {strong_names[0] if strong_names else 'Java'} and {strong_names[1] if len(strong_names) > 1 else 'Cloud Computing'} should remain a continuous priority."
                ],
                "generatedAt": datetime.now().strftime("%d %b %Y, %H:%M:%S")
            }
            self.send_json(res_payload)
            return

        # 3d. AI Assessment Question Generator Engine (Universal: Gemini + OpenAI + Adaptive Domain Synthesizer)
        if path == '/api/ai/generate-questions':
            course_id = (body.get('courseId') or body.get('course_id') or 'CUSTOM').strip()
            course_name = (body.get('courseName') or body.get('course_name') or 'General Technology & Engineering').strip()
            topic = (body.get('topic') or 'Core Conceptual Principles').strip()
            difficulty = (body.get('difficulty') or 'Medium').capitalize()
            q_type = (body.get('type') or body.get('q_type') or 'MCQ').strip()
            is_subjective = q_type.upper() in ['SUBJECTIVE', 'SHORT_ANSWER', 'SHORT ANSWER', 'DESCRIPTIVE']
            try:
                count = int(body.get('count', 3))
            except:
                count = 3
            count = max(1, min(count, 10))
            blooms = body.get('bloomsLevel') or ('Application' if difficulty == 'Medium' else 'Analysis' if difficulty == 'Hard' else 'Knowledge')

            generated_questions = []
            source_engine = "CredGen Universal Academic AI Engine"

            # -------------------------------------------------------------
            # Attempt 1: Google Gemini API (if GEMINI_API_KEY / GOOGLE_API_KEY configured)
            # -------------------------------------------------------------
            gemini_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
            if not gemini_key and os.path.exists('.env'):
                try:
                    with open('.env', 'r', encoding='utf-8') as ef:
                        for line in ef:
                            line_s = line.strip()
                            if line_s.startswith(('GEMINI_API_KEY=', 'GOOGLE_API_KEY=')):
                                gemini_key = line_s.split('=', 1)[1].strip('"\'')
                                break
                except:
                    pass

            if gemini_key:
                try:
                    if is_subjective:
                        gem_prompt = (
                            f"Generate {count} rigorous university-grade 5-Mark Subjective / Short Answer questions on {topic} for course {course_id} - {course_name} at {difficulty} level.\n"
                            "Respond ONLY in valid JSON matching schema: {\"questions\": [{\"questionText\": \"...\", \"modelAnswer\": \"...\", \"keyPoints\": [\"...\", \"...\", \"...\"], \"rubric\": \"...\", \"explanation\": \"...\"}]}"
                        )
                    else:
                        gem_prompt = (
                            f"Generate {count} rigorous academic Multiple Choice Questions on {topic} for course {course_id} - {course_name} at {difficulty} level with 4 distinct options.\n"
                            "Respond ONLY in valid JSON matching schema: {\"questions\": [{\"questionText\": \"...\", \"options\": [{\"id\": \"opt_1\", \"text\": \"...\"}, {\"id\": \"opt_2\", \"text\": \"...\"}, {\"id\": \"opt_3\", \"text\": \"...\"}, {\"id\": \"opt_4\", \"text\": \"...\"}], \"correctOptionId\": \"opt_1\", \"explanation\": \"...\"}]}"
                        )
                    gem_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
                    gem_payload = {
                        "contents": [{"parts": [{"text": gem_prompt}]}],
                        "generationConfig": {"response_mime_type": "application/json", "temperature": 0.3}
                    }
                    gem_req = urllib.request.Request(
                        gem_url,
                        headers={"Content-Type": "application/json"},
                        data=json.dumps(gem_payload).encode('utf-8')
                    )
                    with urllib.request.urlopen(gem_req, timeout=6) as g_resp:
                        g_raw = json.loads(g_resp.read().decode('utf-8'))
                        text_part = g_raw['candidates'][0]['content']['parts'][0]['text']
                        g_json = json.loads(text_part)
                        if 'questions' in g_json and len(g_json['questions']) > 0:
                            marks_val = 5.0 if is_subjective else (2.0 if difficulty == 'Easy' else 4.0 if difficulty == 'Medium' else 5.0)
                            for idx, q in enumerate(g_json['questions'][:count]):
                                qid = f"ai_gen_{int(time.time()*1000)}_{idx+1}"
                                generated_questions.append({
                                    "id": qid,
                                    "courseId": course_id,
                                    "courseName": course_name,
                                    "unit": f"Unit {min(idx+1, 4)}: {topic}",
                                    "topic": topic,
                                    "type": "Subjective" if is_subjective else "MCQ",
                                    "difficulty": difficulty,
                                    "marks": marks_val,
                                    "negativeMarks": 0.0 if is_subjective else round(marks_val * 0.25, 2),
                                    "bloomsLevel": blooms,
                                    "questionText": q.get('questionText', ''),
                                    "options": q.get('options', []),
                                    "correctOptionId": q.get('correctOptionId', 'opt_1'),
                                    "modelAnswer": q.get('modelAnswer', ''),
                                    "keyPoints": q.get('keyPoints', []),
                                    "rubric": q.get('rubric', ''),
                                    "explanation": q.get('explanation', 'Verified curricular standard.')
                                })
                            source_engine = "Google Gemini 1.5 Flash (Live AI)"
                except Exception as e_gem:
                    pass

            # -------------------------------------------------------------
            # Attempt 2: OpenAI API (if configured and quota available)
            # -------------------------------------------------------------
            if not generated_questions:
                openai_key = os.environ.get('OPENAI_API_KEY', '')
                if not openai_key and os.path.exists('.env'):
                    try:
                        with open('.env', 'r', encoding='utf-8') as ef:
                            for line in ef:
                                if line.startswith('OPENAI_API_KEY='):
                                    openai_key = line.strip().split('=', 1)[1].strip('"\'')
                                    break
                    except:
                        pass
                if openai_key:
                    try:
                        if is_subjective:
                            sys_p = "You are an Examination Author for accredited technical universities. Generate 5-mark Subjective questions in JSON matching schema: {\"questions\": [{\"questionText\": \"...\", \"modelAnswer\": \"...\", \"keyPoints\": [\"...\"], \"rubric\": \"...\", \"explanation\": \"...\"}]}"
                            user_p = f"Course: {course_id} - {course_name}\nTopic: {topic}\nDifficulty: {difficulty}\nQuantity: {count}"
                        else:
                            sys_p = "You are an Examination Author for accredited technical universities. Generate MCQs in JSON matching schema: {\"questions\": [{\"questionText\": \"...\", \"options\": [{\"id\": \"opt_1\", \"text\": \"...\"}, {\"id\": \"opt_2\", \"text\": \"...\"}, {\"id\": \"opt_3\", \"text\": \"...\"}, {\"id\": \"opt_4\", \"text\": \"...\"}], \"correctOptionId\": \"opt_1\", \"explanation\": \"...\"}]}"
                            user_p = f"Course: {course_id} - {course_name}\nTopic: {topic}\nDifficulty: {difficulty}\nQuantity: {count}"
                        
                        req_oa = urllib.request.Request(
                            "https://api.openai.com/v1/chat/completions",
                            headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                            data=json.dumps({
                                "model": "gpt-4o-mini",
                                "messages": [{"role": "system", "content": sys_p}, {"role": "user", "content": user_p}],
                                "response_format": {"type": "json_object"},
                                "temperature": 0.3
                            }).encode('utf-8')
                        )
                        with urllib.request.urlopen(req_oa, timeout=6) as resp_oa:
                            content_oa = json.loads(json.loads(resp_oa.read().decode('utf-8'))['choices'][0]['message']['content'])
                            if 'questions' in content_oa and len(content_oa['questions']) > 0:
                                marks_val = 5.0 if is_subjective else (2.0 if difficulty == 'Easy' else 4.0 if difficulty == 'Medium' else 5.0)
                                for idx, q in enumerate(content_oa['questions'][:count]):
                                    qid = f"ai_gen_{int(time.time()*1000)}_{idx+1}"
                                    generated_questions.append({
                                        "id": qid,
                                        "courseId": course_id,
                                        "courseName": course_name,
                                        "unit": f"Unit {min(idx+1, 4)}: {topic}",
                                        "topic": topic,
                                        "type": "Subjective" if is_subjective else "MCQ",
                                        "difficulty": difficulty,
                                        "marks": marks_val,
                                        "negativeMarks": 0.0 if is_subjective else round(marks_val * 0.25, 2),
                                        "bloomsLevel": blooms,
                                        "questionText": q.get('questionText', ''),
                                        "options": q.get('options', []),
                                        "correctOptionId": q.get('correctOptionId', 'opt_1'),
                                        "modelAnswer": q.get('modelAnswer', ''),
                                        "keyPoints": q.get('keyPoints', []),
                                        "rubric": q.get('rubric', ''),
                                        "explanation": q.get('explanation', 'Verified curricular standard.')
                                    })
                                source_engine = "OpenAI GPT-4o-mini (Live AI)"
                    except Exception:
                        pass

            # -------------------------------------------------------------
            # Attempt 3: Universal Dynamic Academic Synthesizer (Zero-Failure Engine)
            # Operates for ANY custom topic, course, or subject without limits!
            # -------------------------------------------------------------
            if not generated_questions:
                source_engine = "CredGen Universal Academic AI Synthesizer"
                t_clean = topic.strip() if topic.strip() else 'Core Theoretical Principles'
                c_name = course_name.strip() if course_name.strip() else 'Advanced Technology'
                c_id = course_id.strip() if course_id.strip() else 'TECH-101'
                marks_val = 5.0 if is_subjective else (2.0 if difficulty == 'Easy' else 4.0 if difficulty == 'Medium' else 5.0)
                neg_m = 0.0 if is_subjective else round(marks_val * 0.25, 2)
                t_lower = t_clean.lower()
                c_lower = c_name.lower()
                combined = f"{t_lower} {c_lower}"

                # Domain Knowledge Repositories
                DOMAINS = [
                    {
                        "keys": ["neural", "machine learning", "deep learning", "ai", "artificial intelligence", "backprop", "gradient", "cnn", "rnn", "transformer", "classification", "regression", "clustering"],
                        "mcq": [
                            {
                                "q": f"In the context of {t_clean}, how does the gradient descent optimization algorithm guarantee convergence toward an optimal minimum of the empirical risk loss function?",
                                "opts": [
                                    "By iteratively adjusting parameter weights in the direction opposite to the gradient vector scaled by the learning rate",
                                    "By applying random permutations to layer weights until loss variance drops below zero",
                                    "By fixing parameter updates to constant integers regardless of partial derivative magnitude",
                                    "By discarding negative loss gradients and solely accumulating positive differentials"
                                ],
                                "exp": f"Gradient descent computes partial derivatives (dL/dW) and updates parameters along the steepest negative slope: W = W - eta * (dL/dW)."
                            },
                            {
                                "q": f"Which critical pathology directly impedes training performance in deep architectures during {t_clean}, and how is it mathematically mitigated?",
                                "opts": [
                                    "Vanishing/Exploding gradients; mitigated via non-saturating activations (e.g. ReLU/GELU), residual skip connections, and layer normalization",
                                    "Underfitting caused by excessive parameter counts; mitigated by disabling all regularization and dropout layers",
                                    "Loss function divergence caused by insufficient epochs; mitigated by expanding batch sizes to infinity",
                                    "Stochastic resonance; mitigated by disabling backpropagation on hidden layers"
                                ],
                                "exp": f"Vanishing gradients cause backpropagated errors to decay exponentially through deep layers; normalization, residual skip links, and non-saturating activations preserve gradient flow."
                            },
                            {
                                "q": f"When evaluating a predictive model trained on {t_clean}, what is the fundamental trade-off governed by the Bias-Variance dilemma?",
                                "opts": [
                                    "High bias causes systematic underfitting from oversimplified assumptions, whereas high variance causes overfitting on training sample noise",
                                    "High bias increases training speed at the expense of RAM memory consumption",
                                    "Variance measures convergence speed while bias measures the batch size requirements",
                                    "Low bias guarantees zero generalization error on unseen test distributions"
                                ],
                                "exp": f"Increasing model complexity reduces approximation bias but increases sensitivity to sample variance, necessitating regularized hyperparameter tuning."
                            }
                        ],
                        "sub": [
                            {
                                "q": f"Explain the fundamental mathematical principles, architecture, and training lifecycle of {t_clean} in {c_name}. Detail the forward pass, loss computation, and backpropagation mechanics with relevant equations.",
                                "modelAnswer": f"In {c_name}, {t_clean} operates through an iterative optimization lifecycle: (1) Forward Transformation: Input feature vectors x are projected through weight matrices W and bias vectors b via activation functions sigma(z), yielding predicted output y_hat = sigma(W*x + b). (2) Objective Function: An empirical loss L(y, y_hat) evaluates divergence from ground-truth targets. (3) Backward Propagation (Credit Assignment): Utilizing the chain rule of calculus, partial derivatives of the loss with respect to all layer weights (dL/dW) are computed backward through network topology. (4) Parameter Optimization: Weights are updated via optimizer rules: W_new = W_old - eta * (dL/dW). Techniques such as Adam optimization, L2 weight decay, and dropout prevent overfitting and accelerate convergence.",
                                "keyPoints": [
                                    "Mathematical formulation of forward projection and objective loss calculation (2 Marks)",
                                    "Chain rule backward propagation and gradient derivation (2 Marks)",
                                    "Practical convergence techniques (learning rate, regularization, and optimization) (1 Mark)"
                                ],
                                "rubric": "5 Marks: 2M for clear forward equations; 2M for chain rule backprop steps; 1M for practical optimization techniques."
                            }
                        ]
                    },
                    {
                        "keys": ["os", "operating system", "process", "thread", "scheduling", "deadlock", "memory", "paging", "semaphore", "mutex"],
                        "mcq": [
                            {
                                "q": f"In modern Operating Systems managing {t_clean}, what mechanism ensures thread-safe critical section execution without wasteful busy-waiting (spinning)?",
                                "opts": [
                                    "Blocking synchronization primitives (e.g. semaphores/mutexes) that transition waiting threads to a BLOCKED queue until signaled",
                                    "Spinlocks running continuous empty while loops consuming maximum CPU execution cycles",
                                    "Disabling hardware interrupts across all CPU cores for the entire duration of thread runtime",
                                    "Re-allocating the entire virtual address space of the process on each lock acquisition"
                                ],
                                "exp": f"Blocking primitives put threads into a sleep state in the kernel scheduler queue, freeing the CPU core for other executable workloads."
                            },
                            {
                                "q": f"Regarding memory management in {t_clean}, how does the Translation Lookaside Buffer (TLB) accelerate virtual-to-physical address translation?",
                                "opts": [
                                    "By acting as a high-speed associative hardware cache that stores recent virtual-to-physical page table mappings, reducing memory bus latency",
                                    "By compressing unused physical frames onto swap disk storage in real time",
                                    "By converting 64-bit virtual addresses directly into 8-bit cache line tags",
                                    "By eliminating the need for page tables entirely in multi-level architectures"
                                ],
                                "exp": f"The TLB caches recent page table entries; on a TLB hit, physical frame addresses are resolved in a single hardware cycle without memory bus traversal."
                            }
                        ],
                        "sub": [
                            {
                                "q": f"Analyze the operational architecture of {t_clean} in {c_name}. Discuss how the operating system coordinates resource allocation, concurrency control, and deadlock prevention under heavy multi-tenant workloads.",
                                "modelAnswer": f"In {c_name}, {t_clean} represents a foundational OS sub-system engineered for deterministic execution and fair resource sharing: (1) Architecture & Lifecycle: The kernel isolates execution state in dedicated control blocks (PCB/TCB), maintaining register contexts, program counters, page table roots, and file descriptors. (2) Scheduling & Context Switching: A preemptive scheduler dispatches execution time slices based on priority and historical quantum usage. Context switches save CPU register files to the kernel stack and restore the incoming thread context. (3) Concurrency & Critical Sections: When multiple execution paths access shared memory, mutual exclusion is enforced via atomic hardware instructions (e.g. Compare-And-Swap) or kernel mutexes, preventing race conditions. (4) Anomaly Mitigation: The kernel continuously monitors for deadlocks using Coffman conditions and employs bank algorithms or preemption to guarantee liveness and avoid starvation.",
                                "keyPoints": [
                                    "Kernel execution state management and context switching lifecycle (2 Marks)",
                                    "Concurrency synchronization and critical section protection (2 Marks)",
                                    "System reliability, deadlock prevention, and scheduling guarantees (1 Mark)"
                                ],
                                "rubric": "5 Marks: 2M for kernel context lifecycle; 2M for concurrency mechanisms; 1M for deadlock/reliability analysis."
                            }
                        ]
                    },
                    {
                        "keys": ["network", "tcp", "udp", "ip", "packet", "routing", "socket", "dns", "http", "firewall", "security", "crypto", "cipher", "cyber"],
                        "mcq": [
                            {
                                "q": f"In network protocol architectures concerning {t_clean}, how does the TCP transport protocol guarantee reliable, in-order packet delivery over an inherently unreliable IP network layer?",
                                "opts": [
                                    "Through sequence numbers, cumulative acknowledgments (ACKs), sliding window flow control, and retransmission timers (RTO)",
                                    "By broadcasting duplicate copies of every packet across all physical network interfaces simultaneously",
                                    "By enforcing permanent dedicated circuit-switched hardware paths between endpoints",
                                    "By truncating all packets to 64 bytes to prevent router buffer drops"
                                ],
                                "exp": f"TCP numbers each byte transmitted, tracks acknowledgments, dynamically adjusts congestion windows, and triggers selective retransmission upon timeouts or duplicate ACKs."
                            },
                            {
                                "q": f"When implementing secure communications for {t_clean}, how does the TLS handshake establish an encrypted symmetric session key between client and server?",
                                "opts": [
                                    "By using asymmetric public-key cryptography (e.g. RSA or Diffie-Hellman) to authenticate identities and negotiate a shared symmetric session key (e.g. AES-GCM)",
                                    "By transmitting the master encryption password in plain text inside the initial ClientHello frame",
                                    "By generating fixed hardcoded cryptographic salts agreed upon in the DNS record",
                                    "By disabling packet encryption once the initial TCP three-way handshake completes"
                                ],
                                "exp": f"TLS leverages asymmetric public key cryptography and digital certificates for mutual identity verification and key exchange, then transitions to high-speed symmetric ciphers for payload encryption."
                            }
                        ],
                        "sub": [
                            {
                                "q": f"Provide an end-to-end technical explanation of {t_clean} within {c_name}. Detail the protocol architecture, message exchange workflow, and security considerations.",
                                "modelAnswer": f"In {c_name}, {t_clean} governs standardized data transmission and protocol coordination: (1) Protocol Stack Layering: Communications are structured across standard layers (Application, Transport, Network, Link), encapsulating headers at each boundary (e.g. source/destination ports, IP addresses, MAC addresses, checksums). (2) Connection Lifecycle & Handshake: A stateful session begins with negotiation (e.g. SYN, SYN-ACK, ACK), synchronizing sequence numbers, window scaling options, and cryptographic parameters. (3) Flow & Congestion Control: Data transmission dynamically adapts to receiver buffer limits (Advertised Window) and network transit capacity (Congestion Window) using additive increase / multiplicative decrease (AIMD) algorithms. (4) Security & Integrity: Authenticated encryption (e.g. TLS 1.3 with AES-256-GCM) ensures confidentiality, while cryptographic message authentication codes (HMAC) guarantee tamper-detection.",
                                "keyPoints": [
                                    "Layered protocol structure and header encapsulation (1.5 Marks)",
                                    "Stateful handshake and connection lifecycle workflow (2 Marks)",
                                    "Flow control, congestion management, and cryptographic protection (1.5 Marks)"
                                ],
                                "rubric": "5 Marks: 1.5M for protocol stack; 2M for handshake mechanics; 1.5M for flow control & security."
                            }
                        ]
                    },
                    {
                        "keys": ["database", "sql", "dbms", "rdbms", "transaction", "acid", "normalization", "index", "b-tree", "nosql", "sharding"],
                        "mcq": [
                            {
                                "q": f"Regarding transaction management in {t_clean}, how does Write-Ahead Logging (WAL) enforce the Durability property in relational database engines?",
                                "opts": [
                                    "By strictly writing and flushing log records to non-volatile disk before modifying dirty pages in the shared memory buffer pool",
                                    "By executing all queries in duplicate across redundant memory tables",
                                    "By preventing transactions from writing updates until the system is idle",
                                    "By periodically saving database backups to tape storage every 24 hours"
                                ],
                                "exp": f"Write-Ahead Logging guarantees durability by persisting transaction logs to disk before memory buffers are written, enabling REDO recovery after catastrophic crashes."
                            },
                            {
                                "q": f"In relational schema design for {t_clean}, what mathematical constraint differentiates Boyce-Codd Normal Form (BCNF) from Third Normal Form (3NF)?",
                                "opts": [
                                    "BCNF strictly mandates that for every non-trivial functional dependency X -> Y, X must be a superkey without exception",
                                    "BCNF permits non-superkey determinants as long as the dependent attribute is prime",
                                    "BCNF requires all non-prime attributes to depend transitively on candidate keys",
                                    "BCNF only applies to tables containing composite foreign keys"
                                ],
                                "exp": f"BCNF removes all functional dependency anomalies by requiring the determinant X to be a superkey, whereas 3NF allows exceptions if Y is a prime attribute."
                            }
                        ],
                        "sub": [
                            {
                                "q": f"Examine the architectural design and operational mechanics of {t_clean} in {c_name}. Detail the data structures, concurrency controls, and failure recovery protocols employed by high-scale storage systems.",
                                "modelAnswer": f"In {c_name}, {t_clean} forms the core storage and query processing engine: (1) Storage Engine & Index Structures: Data is organized into fixed-size disk blocks (pages). High-efficiency B+ Tree indexes store record pointers exclusively in doubly linked leaf nodes, maximizing page fan-out and enabling ultra-low depth (3–4 I/O seeks for millions of records) with fast range scanning. (2) Transaction Isolation & Concurrency: Transactions adhere to ACID properties. Isolation is enforced via Multi-Version Concurrency Control (MVCC) or Strict Two-Phase Locking (Strict-2PL), ensuring uncommitted modifications remain locked until commit to eliminate cascading rollbacks. (3) Durability & Crash Recovery: The ARIES recovery framework utilizes Write-Ahead Logging (WAL) with monotonic Log Sequence Numbers (LSNs). During crash recovery, an Analysis phase reconstructs the active transaction table, a REDO phase replays committed logs to restore state, and an UNDO phase rolls back uncommitted dirty updates.",
                                "keyPoints": [
                                    "B+ Tree index storage structures and fan-out mechanics (2 Marks)",
                                    "ACID transaction management and concurrency protocols (1.5 Marks)",
                                    "Write-Ahead Logging (WAL) and crash recovery phases (1.5 Marks)"
                                ],
                                "rubric": "5 Marks: 2M for storage structures; 1.5M for concurrency controls; 1.5M for WAL crash recovery."
                            }
                        ]
                    }
                ]

                # Match domain or use Universal Semantic Generator
                matched_domain = None
                for d in DOMAINS:
                    if any(k in combined for k in d["keys"]):
                        matched_domain = d
                        break

                if matched_domain:
                    pool = matched_domain["sub"] if is_subjective else matched_domain["mcq"]
                    for idx in range(count):
                        base = pool[idx % len(pool)]
                        qid = f"ai_gen_{int(time.time()*1000)}_{idx+1}"
                        if is_subjective:
                            generated_questions.append({
                                "id": qid,
                                "courseId": c_id,
                                "courseName": c_name,
                                "unit": f"Unit {min(idx+1, 4)}: {t_clean}",
                                "topic": t_clean,
                                "type": "Subjective",
                                "difficulty": difficulty,
                                "marks": marks_val,
                                "negativeMarks": neg_m,
                                "bloomsLevel": blooms,
                                "questionText": base["q"],
                                "options": [],
                                "correctOptionId": None,
                                "modelAnswer": base["modelAnswer"],
                                "keyPoints": base["keyPoints"],
                                "rubric": base["rubric"],
                                "explanation": "Authoritative university curriculum standard."
                            })
                        else:
                            raw_opts = list(base["opts"])
                            orig_correct = raw_opts[0]
                            indices = list(range(len(raw_opts)))
                            random.shuffle(indices)
                            opt_list = []
                            correct_oid = "opt_1"
                            for pos, o_idx in enumerate(indices):
                                oid = f"opt_{pos+1}"
                                opt_list.append({"id": oid, "text": raw_opts[o_idx]})
                                if raw_opts[o_idx] == orig_correct:
                                    correct_oid = oid
                            generated_questions.append({
                                "id": qid,
                                "courseId": c_id,
                                "courseName": c_name,
                                "unit": f"Unit {min(idx+1, 4)}: {t_clean}",
                                "topic": t_clean,
                                "type": "MCQ",
                                "difficulty": difficulty,
                                "marks": marks_val,
                                "negativeMarks": neg_m,
                                "bloomsLevel": blooms,
                                "questionText": base["q"],
                                "options": opt_list,
                                "correctOptionId": correct_oid,
                                "explanation": base["exp"]
                            })
                else:
                    # UNIVERSAL ADAPTIVE GENERATOR FOR ANY ARBITRARY TOPIC
                    for idx in range(count):
                        qid = f"ai_gen_{int(time.time()*1000)}_{idx+1}"
                        focus_angle = idx % 4
                        if is_subjective:
                            if focus_angle == 0:
                                q_text = f"Explain the fundamental architectural principles, operational mechanism, and lifecycle of {t_clean} in {c_name}. Illustrate with an appropriate workflow or block diagram description."
                                m_ans = f"In {c_name}, {t_clean} provides a structured paradigm for managing complexity, data transformation, and system coordination: (1) Core Mechanism: {t_clean} breaks down execution states into discrete, deterministically managed stages. (2) Architectural Components: The operational model consists of input parsing, state validation, operational transformation, and output synthesis. (3) Performance & Optimization: Under production constraints, {t_clean} minimizes overhead through resource reuse, caching, and algorithmic efficiency. (4) Industrial Applications: In real-world engineering environments, this architecture ensures high availability and predictable throughput."
                                kp = [
                                    "Theoretical definition and operational working mechanism (2 Marks)",
                                    "Architectural component analysis and workflow interaction (2 Marks)",
                                    "Real-world application, failure mitigation, and performance trade-offs (1 Mark)"
                                ]
                            elif focus_angle == 1:
                                q_text = f"Analyze the performance bottlenecks, failure modes, and optimization strategies associated with {t_clean} in {c_name}. How can modern engineering systems guarantee high reliability when scaling this paradigm?"
                                m_ans = f"Scaling {t_clean} in {c_name} requires careful identification of performance boundaries: (1) Primary Bottlenecks: Resource contention (CPU time slices, memory buffer saturation, or network/disk I/O serialization) represents the chief limitation. (2) Failure Modes & Edge Cases: Unexpected input divergence, unhandled exceptions, and asynchronous race conditions can lead to inconsistent state transitions. (3) Mitigation Strategies: Engineering best practices implement non-blocking concurrent pipelines, defensive boundary validation, and exponential backoff retry policies. (4) Monitoring & Reliability: Continuous health telemetry and automated failover mechanisms guarantee sustained uptime."
                                kp = [
                                    "Identification of scalability bottlenecks and resource constraints (1.5 Marks)",
                                    "Detailed analysis of failure modes and edge-case exceptions (2 Marks)",
                                    "Architectural mitigation, optimization, and reliability guarantees (1.5 Marks)"
                                ]
                            elif focus_angle == 2:
                                q_text = f"Compare and contrast the implementation trade-offs of {t_clean} against conventional alternative approaches in {c_name}. Under what specific operational constraints is {t_clean} the optimal design choice?"
                                m_ans = f"A rigorous comparative evaluation of {t_clean} in {c_name} highlights significant engineering trade-offs: (1) Comparative Analysis: Traditional paradigms prioritize simplicity at the cost of flexibility, whereas {t_clean} introduces modular abstraction layers enabling elastic scaling and maintainability. (2) Trade-Off Dimensions: Time complexity, memory footprint, configuration overhead, and engineering maintenance must be balanced. (3) Optimal Use Cases: {t_clean} is specifically optimal in high-concurrency environments and distributed architectures requiring strict integrity guarantees."
                                kp = [
                                    "Formal comparative evaluation against traditional alternatives (2 Marks)",
                                    "Multi-dimensional trade-off matrix (latency, space, complexity) (1.5 Marks)",
                                    "Identification of optimal operational constraints vs anti-patterns (1.5 Marks)"
                                ]
                            else:
                                q_text = f"Discuss the industry best practices, security considerations, and quality assurance standards required when deploying {t_clean} in enterprise-grade {c_name} implementations."
                                m_ans = f"Enterprise deployment of {t_clean} mandates adherence to comprehensive quality assurance and security frameworks: (1) Quality Engineering: Rigorous unit test coverage, automated integration suites, and regression benchmarks ensure code correctness across edge boundaries. (2) Security Hardening: Adopting the Principle of Least Privilege, cryptographic integrity validation, and input sanitization eliminates vulnerability vectors. (3) Maintenance & Governance: Comprehensive documentation and API versioning protocols facilitate seamless long-term maintainability."
                                kp = [
                                    "Testing methodologies and quality assurance frameworks (2 Marks)",
                                    "Security hardening and vulnerability mitigation practices (1.5 Marks)",
                                    "Long-term maintainability, API governance, and compliance standards (1.5 Marks)"
                                ]
                            generated_questions.append({
                                "id": qid,
                                "courseId": c_id,
                                "courseName": c_name,
                                "unit": f"Unit {min(idx+1, 4)}: {t_clean}",
                                "topic": t_clean,
                                "type": "Subjective",
                                "difficulty": difficulty,
                                "marks": marks_val,
                                "negativeMarks": neg_m,
                                "bloomsLevel": blooms,
                                "questionText": q_text,
                                "options": [],
                                "correctOptionId": None,
                                "modelAnswer": m_ans,
                                "keyPoints": kp,
                                "rubric": "5 Marks: 2M for core theoretical depth; 2M for architectural breakdown; 1M for industry practices.",
                                "explanation": f"Authoritative academic analysis on {t_clean} ({c_name})."
                            })
                        else:
                            # MCQ for arbitrary topic
                            if focus_angle == 0:
                                q_text = f"In the technical study of {t_clean} ({c_name}), which of the following statements most accurately defines its primary architectural function?"
                                correct_text = "To establish a structured, deterministic framework that optimizes execution flow and guarantees data integrity under operational constraints"
                                distractors = [
                                    "To bypass system abstraction boundaries and execute unverified low-level instructions directly on raw storage",
                                    "To eliminate all memory allocations by restricting data representation strictly to static 8-bit integers",
                                    "To randomize instruction execution order to eliminate all predictable deterministic patterns"
                                ]
                                exp_text = f"In {c_name}, {t_clean} is specifically engineered to provide structured, deterministic execution guarantees while preserving system abstraction boundaries."
                            elif focus_angle == 1:
                                q_text = f"When evaluating performance characteristics of {t_clean}, which operational condition represents the most severe bottleneck or constraint?"
                                correct_text = "Resource contention and synchronization latency during high-concurrency throughput or intensive memory access"
                                distractors = [
                                    "Excessive compiler optimization leading to automated source code deletion",
                                    "Deterministic execution speeds exceeding the physical clock speed of the underlying motherboard",
                                    "Lack of support for floating-point arithmetic across modern 64-bit microprocessors"
                                ]
                                exp_text = f"High concurrency and shared-state synchronization typically introduce latency and resource serialization constraints in {t_clean} systems."
                            elif focus_angle == 2:
                                q_text = f"What is the recommended industry best practice to prevent state anomalies and race conditions when implementing {t_clean}?"
                                correct_text = "Enforcing atomic state mutations, defensive boundary validation, and appropriate concurrency synchronization primitives"
                                distractors = [
                                    "Disabling all error logging and allowing unhandled exceptions to terminate silently",
                                    "Granting global read and write permissions to all unauthenticated network endpoints",
                                    "Executing all transactions exclusively on a single hardware thread without backups or timeouts"
                                ]
                                exp_text = f"Defensive boundary validation and atomic synchronization ensure that {t_clean} implementations remain immune to data corruption and race conditions."
                            else:
                                q_text = f"Which computational complexity property is most characteristic of optimal implementations of {t_clean} in {c_name}?"
                                correct_text = "Achieving amortized polynomial or logarithmic scaling efficiency relative to the size of the input problem"
                                distractors = [
                                    "Requiring factorial O(N!) computational steps regardless of the simplicity of the underlying workload",
                                    "Operating with non-terminating infinite recursion across all valid edge cases",
                                    "Consuming memory linearly proportional to the square of total network bandwidth"
                                ]
                                exp_text = f"Efficient implementations of {t_clean} prioritize scalable algorithmic bounds (such as O(log N) or O(N log N)) to prevent exponential degradation."

                            raw_opts = [correct_text] + distractors
                            indices = list(range(4))
                            random.shuffle(indices)
                            opt_list = []
                            correct_oid = "opt_1"
                            for pos, o_idx in enumerate(indices):
                                oid = f"opt_{pos+1}"
                                opt_list.append({"id": oid, "text": raw_opts[o_idx]})
                                if raw_opts[o_idx] == correct_text:
                                    correct_oid = oid

                            generated_questions.append({
                                "id": qid,
                                "courseId": c_id,
                                "courseName": c_name,
                                "unit": f"Unit {min(idx+1, 4)}: {t_clean}",
                                "topic": t_clean,
                                "type": "MCQ",
                                "difficulty": difficulty,
                                "marks": marks_val,
                                "negativeMarks": neg_m,
                                "bloomsLevel": blooms,
                                "questionText": q_text,
                                "options": opt_list,
                                "correctOptionId": correct_oid,
                                "explanation": exp_text
                            })

            self.send_json({
                "success": True,
                "engine": source_engine,
                "courseId": course_id,
                "courseName": course_name,
                "topic": topic,
                "difficulty": difficulty,
                "type": "Subjective" if is_subjective else "MCQ",
                "count": len(generated_questions),
                "questions": generated_questions,
                "generatedAt": datetime.now().strftime("%d %b %Y, %H:%M:%S")
            })
            return

        # 4. Avatar Upload
        if path.startswith('/api/users/') and path.endswith('/avatar'):
            user_id = path.split('/')[3]
            avatar_data = body.get('avatar', '')

            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("UPDATE users SET avatar = ? WHERE id = ?", (avatar_data, user_id))
            conn.commit()
            conn.close()

            self.send_json({
                "success": True,
                "message": "User avatar updated successfully.",
                "user_id": user_id,
                "is_custom_avatar": bool(avatar_data)
            })
            return

        # 5. Question Creation (Single)
        if path == '/api/questions':
            q_id = f"qb_{int(time.time() * 1000)}"
            course_id = body.get('courseId', 'CS-302')
            course_name = body.get('courseName', 'Database Management Systems')
            unit = body.get('unit', 'Unit 1')
            topic = body.get('topic', 'General Curriculum')
            q_type = body.get('type', 'MCQ')
            marks = float(body.get('marks', 2.0))
            neg_marks = float(body.get('negativeMarks', 0.5))
            text = body.get('questionText', '')
            options = body.get('options', [])
            correct_opt = body.get('correctOptionId', 'opt_1')

            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("""
            INSERT INTO questions (id, course_id, course_name, unit, topic, type, marks, negative_marks, question_text, options_json, correct_option_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (q_id, course_id, course_name, unit, topic, q_type, marks, neg_marks, text, json.dumps(options), correct_opt))
            conn.commit()
            conn.close()

            self.send_json({"success": True, "message": "Question authored successfully.", "questionId": q_id})
            return

        # 6. Bulk Questions Ingestion
        if path == '/api/questions/bulk':
            parsed_questions = body.get('questions', [])
            if not parsed_questions:
                self.send_json({"success": False, "message": "No parsed questions received."}, 400)
                return

            conn = get_db_connection()
            cur = conn.cursor()
            inserted_count = 0
            for idx, item in enumerate(parsed_questions):
                q_id = f"qb_bulk_{int(time.time())}_{idx}_{random.randint(100, 999)}"
                cur.execute("""
                INSERT INTO questions (id, course_id, course_name, unit, topic, type, marks, negative_marks, question_text, options_json, correct_option_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    q_id,
                    item.get('courseId', 'CS-302'),
                    item.get('courseName', 'Curriculum'),
                    item.get('unit', 'Unit Ingested'),
                    item.get('topic', 'Bulk Import'),
                    item.get('type', 'MCQ'),
                    float(item.get('marks', 2.0)),
                    float(item.get('negativeMarks', 0.5)),
                    item.get('questionText', ''),
                    json.dumps(item.get('options', [])),
                    item.get('correctOptionId', 'opt_1')
                ))
                inserted_count += 1

            conn.commit()
            conn.close()
            print(f"[QUESTION-BULK] Successfully ingested {inserted_count} questions into SQLite.")
            self.send_json({"success": True, "message": f"Successfully ingested {inserted_count} questions.", "count": inserted_count})
            return

        # 7. Exam Creation
        if path == '/api/exams':
            e_id = f"exam_{int(time.time())}"
            title = body.get('title', 'Examination')
            course_id = body.get('courseId', 'CS-302')
            course_name = body.get('courseName', 'Curriculum Assessment')
            exam_type = body.get('examType', 'Timed Evaluation')
            total_marks = float(body.get('totalMarks', 30.0))
            pass_marks = float(body.get('passingMarks', 12.0))
            duration = int(body.get('durationMinutes', 60))
            neg_marking = 1 if body.get('negativeMarking', True) else 0
            neg_val = float(body.get('negativeMarkValue', 0.5))
            credits = float(body.get('creditWeight', 4.0))
            batches = body.get('assignedBatches', ['B.Tech CSE'])
            created_by = body.get('createdBy', 'Administrator')
            q_ids = body.get('questionIds', [])

            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("""
            INSERT INTO exams (id, title, course_id, course_name, exam_type, total_marks, passing_marks, duration_minutes, negative_marking, negative_mark_value, credit_weight, status, assigned_batches_json, created_by, question_ids_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
            """, (e_id, title, course_id, course_name, exam_type, total_marks, pass_marks, duration, neg_marking, neg_val, credits, json.dumps(batches), created_by, json.dumps(q_ids)))
            conn.commit()
            conn.close()

            self.send_json({"success": True, "message": "Examination created successfully.", "examId": e_id})
            return

        # 8. Marksheet Publish & Verification Hash Generation
        if path.startswith('/api/marksheets/') and path.endswith('/publish'):
            record_id = path.split('/')[3]
            publisher = body.get('publishedBy', 'Vivek Kumar (Chief Administrator)')
            publish_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
            
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT * FROM marksheets WHERE id = ?", (record_id,))
            record = cur.fetchone()
            if not record:
                conn.close()
                self.send_json({"success": False, "message": "Record not found."}, 404)
                return

            v_hash = hashlib.sha256(f"{record['id']}_{record['roll_no']}_{record['sgpa']}_{publish_time}".encode('utf-8')).hexdigest()
            cur.execute("""
            UPDATE marksheets 
            SET publish_status = 'PUBLISHED', published_by = ?, published_at = ?, verification_hash = ?
            WHERE id = ?
            """, (publisher, publish_time, v_hash, record_id))
            conn.commit()
            conn.close()

            print(f"[CBCS-PUBLISH] Transcript {record_id} published with SHA-256 hash {v_hash[:16]}...")
            self.send_json({
                "success": True,
                "message": "Marksheet published to candidate portal.",
                "recordId": record_id,
                "verificationHash": v_hash,
                "publishedAt": publish_time
            })
            return

        # 9. User Account Restoration
        if path.startswith('/api/users/') and path.endswith('/restore'):
            user_id = path.split('/')[3]
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("UPDATE users SET status = 'ACTIVE' WHERE id = ?", (user_id,))
            conn.commit()
            conn.close()
            self.send_json({"success": True, "message": "User account restored."})
            return

        # 10. Enrol Subject into Candidate Marksheet
        if path.startswith('/api/marksheets/') and path.endswith('/courses'):
            record_id = path.split('/')[3]
            course = body.get('course')
            if not course or not course.get('code'):
                self.send_json({"success": False, "message": "Course code and title required."}, 400)
                return

            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT * FROM marksheets WHERE id = ? OR student_id = ? OR roll_no = ?", (record_id, record_id, record_id))
            row = cur.fetchone()
            if not row:
                conn.close()
                self.send_json({"success": False, "message": "Candidate marksheet record not found."}, 404)
                return
            rec = dict(row)

            courses = json.loads(rec.get('courses_json') or '[]')
            if any(c.get('code') == course['code'] for c in courses):
                conn.close()
                self.send_json({"success": False, "message": f"Candidate is already enrolled in {course['code']}."}, 400)
                return

            courses.append(course)
            eval_courses, tot_cred, tot_cp, sgpa = compute_sgpa(courses)
            cur.execute("""
            UPDATE marksheets 
            SET courses_json = ?, sgpa = ?, total_credits = ?
            WHERE id = ?
            """, (json.dumps(eval_courses), sgpa, tot_cred, rec['id']))
            conn.commit()
            conn.close()

            print(f"[CURRICULUM-ENROL] Enrolled course {course['code']} into marksheet {rec['id']} (New SGPA: {sgpa}).")
            self.send_json({
                "success": True,
                "message": f"Course {course['code']} enrolled successfully.",
                "recordId": rec['id'],
                "sgpa": sgpa,
                "totalCredits": tot_cred,
                "courses": eval_courses
            })
            return

        # 11. Drop/Remove Subject from Candidate Marksheet
        if path.startswith('/api/marksheets/') and path.endswith('/drop-course'):
            record_id = path.split('/')[3]
            course_code = body.get('code')
            if not course_code:
                self.send_json({"success": False, "message": "Course code required."}, 400)
                return

            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT * FROM marksheets WHERE id = ? OR student_id = ? OR roll_no = ?", (record_id, record_id, record_id))
            row = cur.fetchone()
            if not row:
                conn.close()
                self.send_json({"success": False, "message": "Candidate marksheet record not found."}, 404)
                return
            rec = dict(row)

            courses = json.loads(rec.get('courses_json') or '[]')
            filtered_courses = [c for c in courses if c.get('code') != course_code]
            eval_courses, tot_cred, tot_cp, sgpa = compute_sgpa(filtered_courses)
            cur.execute("""
            UPDATE marksheets 
            SET courses_json = ?, sgpa = ?, total_credits = ?
            WHERE id = ?
            """, (json.dumps(eval_courses), sgpa, tot_cred, rec['id']))
            conn.commit()
            conn.close()

            print(f"[CURRICULUM-DROP] Dropped course {course_code} from marksheet {rec['id']}.")
            self.send_json({
                "success": True,
                "message": f"Course {course_code} removed from candidate marksheet.",
                "recordId": rec['id'],
                "sgpa": sgpa,
                "totalCredits": tot_cred,
                "courses": eval_courses
            })
            return

        # 12. Submit Exam & Directly Record Evaluation into Candidate Marksheet
        if path == '/api/exams/submit':
            student_id = body.get('studentId', 'usr_student_rahul')
            student_name = body.get('studentName', 'Rahul Verma')
            roll_no = body.get('rollNo', '11242601')
            exam_id = body.get('examId', 'exam_2026_dbms_mid')
            responses = body.get('responses', {})

            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT * FROM exams WHERE id = ?", (exam_id,))
            exam = cur.fetchone()
            course_code = exam['course_id'] if exam else 'CS-302'
            course_name = exam['course_name'] if exam else 'Database Management Systems'
            credit_weight = float(exam['credit_weight']) if exam else 4.0

            # Calculate score against questions in course
            cur.execute("SELECT id, marks, correct_option_id FROM questions WHERE course_id = ?", (course_code,))
            questions = cur.fetchall()
            scored = 0.0
            total_marks = 0.0
            for q in questions:
                total_marks += float(q['marks'])
                if responses.get(q['id']) == q['correct_option_id']:
                    scored += float(q['marks'])
                elif responses.get(q['id']) and exam and exam['negative_marking']:
                    scored -= float(exam['negative_mark_value'])

            if scored < 0: scored = 0.0
            ratio = (scored / total_marks) if total_marks > 0 else 0.85
            mid_term = round(ratio * 20.0, 1)
            internal = 26.0
            end_term = round(ratio * 50.0, 1)

            course_entry = {
                "code": course_code,
                "title": course_name,
                "credits": credit_weight,
                "internal": internal,
                "midTerm": mid_term,
                "endTerm": end_term,
                "maxMarks": 100
            }

            cur.execute("SELECT * FROM marksheets WHERE student_id = ? OR roll_no = ?", (student_id, roll_no))
            row = cur.fetchone()

            if row:
                existing_rec = dict(row)
                curr_courses = json.loads(existing_rec.get('courses_json') or '[]')
                if any(c.get('code') == course_code for c in curr_courses):
                    updated = [course_entry if c.get('code') == course_code else c for c in curr_courses]
                else:
                    updated = curr_courses + [course_entry]
                eval_courses, tot_cred, tot_cp, sgpa = compute_sgpa(updated)
                cur.execute("""
                UPDATE marksheets 
                SET courses_json = ?, sgpa = ?, total_credits = ?
                WHERE id = ?
                """, (json.dumps(eval_courses), sgpa, tot_cred, existing_rec['id']))
                rec_id = existing_rec['id']
            else:
                eval_courses, tot_cred, tot_cp, sgpa = compute_sgpa([course_entry])
                rec_id = f"rec_{student_id}_sem6"
                v_hash = hashlib.sha256(f"{rec_id}_{roll_no}_{sgpa}".encode('utf-8')).hexdigest()
                cur.execute("""
                INSERT INTO marksheets (id, student_id, student_name, roll_no, program, semester, batch, courses_json, sgpa, total_credits, publish_status, published_by, published_at, verification_hash, qr_payload)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', NULL, NULL, ?, ?)
                """, (
                    rec_id, student_id, student_name, roll_no,
                    'B.Tech in Computer Science & Engineering', 'Semester VI (Session 2026\u20132027)', '2023\u20132027',
                    json.dumps(eval_courses), sgpa, tot_cred, v_hash, f"CREDGEN-VERIFY-{roll_no}"
                ))

            conn.commit()
            conn.close()

            print(f"[EXAM-MARKSHEET] Recorded exam {course_code} directly into marksheet {rec_id} (SGPA: {sgpa}).")
            self.send_json({
                "success": True,
                "message": f"Assessment for {course_code} recorded directly to candidate marksheet.",
                "recordId": rec_id,
                "score": scored,
                "totalPossible": total_marks,
                "sgpa": sgpa,
                "totalCredits": tot_cred,
                "courses": eval_courses
            })
            return

        # 13. Create Support Desk Query / Feedback / Grievance
        if path == '/api/support' or path == '/api/support/create':
            name = body.get('name', '').strip()
            email = body.get('email', '').strip()
            subject = body.get('subject', '').strip()
            message = body.get('message', '').strip()

            if not name or not email or not subject or not message:
                self.send_json({"success": False, "message": "Name, email, subject, and message are required."}, 400)
                return

            user_id = body.get('userId')
            phone = body.get('phone', '')
            role = body.get('role', 'GUEST').upper()
            q_type = body.get('type', 'QUERY').upper()
            category = body.get('category', 'GENERAL').upper()
            priority = body.get('priority', 'NORMAL').upper()

            ticket_id = f"sup_{int(time.time())}_{random.randint(100, 999)}"

            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("""
            INSERT INTO support_queries (id, user_id, name, email, phone, role, type, category, subject, message, priority, status, admin_notes, resolved_by, resolved_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', NULL, NULL, NULL)
            """, (ticket_id, user_id, name, email, phone, role, q_type, category, subject, message, priority))
            conn.commit()

            cur.execute("SELECT * FROM support_queries WHERE id = ?", (ticket_id,))
            created_ticket = dict(cur.fetchone())
            conn.close()

            print(f"[SUPPORT-DESK] Logged new query {ticket_id} ({subject}) from {name} [{role}].")
            self.send_json({
                "success": True,
                "message": "Communication logged successfully with Examination Directorate. Reference Ticket ID: " + ticket_id,
                "ticket": created_ticket
            }, 201)
            return

        # 14. Update Support Query Status / Remarks (POST compatibility)
        if path.startswith('/api/support/') and any(action in path for action in ['/status', '/resolve', '/update']):
            ticket_id = path.split('/')[3]
            status = body.get('status', 'RESOLVED').upper()
            admin_notes = body.get('adminNotes') or body.get('admin_notes', '')
            resolved_by = body.get('resolvedBy') or body.get('resolved_by', 'Administrator')

            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT * FROM support_queries WHERE id = ?", (ticket_id,))
            if not cur.fetchone():
                conn.close()
                self.send_json({"success": False, "message": "Support query not found."}, 404)
                return

            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S") if status in ('RESOLVED', 'CLOSED') else None
            cur.execute("""
            UPDATE support_queries 
            SET status = ?, admin_notes = ?, resolved_by = ?, resolved_at = COALESCE(?, resolved_at)
            WHERE id = ?
            """, (status, admin_notes, resolved_by, now_str, ticket_id))
            conn.commit()

            cur.execute("SELECT * FROM support_queries WHERE id = ?", (ticket_id,))
            updated_ticket = dict(cur.fetchone())
            conn.close()

            print(f"[SUPPORT-DESK] Ticket {ticket_id} updated: status={status}, by={resolved_by}")
            self.send_json({
                "success": True,
                "message": f"Support ticket status updated to {status}.",
                "ticket": updated_ticket
            })
            return

        self.send_json({"error": "Endpoint not found", "path": path}, 404)

    # -------------------------------------------------------------
    # PUT Endpoints Router
    # -------------------------------------------------------------
    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Delegate user updates and other POST-compatible handlers to do_POST
        if path.startswith('/api/users/'):
            return self.do_POST()

        body = self.read_json_body()

        # Update Support Query Status & Remarks via PUT
        if path.startswith('/api/support/'):
            ticket_id = path.split('/')[3]
            status = body.get('status', 'RESOLVED').upper()
            admin_notes = body.get('adminNotes') or body.get('admin_notes', '')
            resolved_by = body.get('resolvedBy') or body.get('resolved_by', 'Administrator')

            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT * FROM support_queries WHERE id = ?", (ticket_id,))
            if not cur.fetchone():
                conn.close()
                self.send_json({"success": False, "message": "Support query not found."}, 404)
                return

            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S") if status in ('RESOLVED', 'CLOSED') else None
            cur.execute("""
            UPDATE support_queries 
            SET status = ?, admin_notes = ?, resolved_by = ?, resolved_at = COALESCE(?, resolved_at)
            WHERE id = ?
            """, (status, admin_notes, resolved_by, now_str, ticket_id))
            conn.commit()

            cur.execute("SELECT * FROM support_queries WHERE id = ?", (ticket_id,))
            updated_ticket = dict(cur.fetchone())
            conn.close()

            print(f"[SUPPORT-DESK] Ticket {ticket_id} updated via PUT: status={status}, by={resolved_by}")
            self.send_json({
                "success": True,
                "message": f"Support ticket status updated to {status}.",
                "ticket": updated_ticket
            })
            return

        self.send_json({"error": "Endpoint not found", "path": path}, 404)

    # -------------------------------------------------------------
    # DELETE Endpoints Router
    # -------------------------------------------------------------
    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # 1. Soft-delete user
        if path.startswith('/api/users/'):
            user_id = path.split('/')[3]
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("UPDATE users SET status = 'ARCHIVED' WHERE id = ?", (user_id,))
            conn.commit()
            conn.close()
            self.send_json({"success": True, "message": "User account archived.", "userId": user_id})
            return

        # 2. Delete question from repository
        if path.startswith('/api/questions/'):
            q_id = path.split('/')[3]
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("DELETE FROM questions WHERE id = ?", (q_id,))
            conn.commit()
            conn.close()
            self.send_json({"success": True, "message": "Question deleted from repository.", "questionId": q_id})
            return

        # 3. Delete / Archive support ticket
        if path.startswith('/api/support/'):
            ticket_id = path.split('/')[3]
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("DELETE FROM support_queries WHERE id = ?", (ticket_id,))
            conn.commit()
            conn.close()
            print(f"[SUPPORT-DESK] Ticket {ticket_id} deleted.")
            self.send_json({"success": True, "message": "Support ticket deleted successfully.", "ticketId": ticket_id})
            return

        self.send_json({"error": "Endpoint not found", "path": path}, 404)

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

def run_server_instance(port):
    server_address = ('0.0.0.0', port)
    try:
        with ThreadedTCPServer(server_address, CredGenApiServer) as httpd:
            print(f"[CREDGEN-SERVER] Active on http://0.0.0.0:{port}")
            httpd.serve_forever()
    except Exception as e:
        print(f"[CREDGEN-SERVER] Warning: Could not bind port {port} ({e})")

def main():
    init_database()
    print("=" * 70)
    print(f"[CREDGEN-BACKEND] SQLite Relational Storage: {DB_FILE}")
    print(f"[CREDGEN-BACKEND] Full-Stack Server & API active on local & cloud ports")
    print("=" * 70)

    ports_to_bind = [5000, 5173]
    env_port = os.environ.get("PORT")
    if env_port and env_port.isdigit():
        ports_to_bind.append(int(env_port))
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        ports_to_bind.append(int(sys.argv[1]))

    target_ports = sorted(list(set(ports_to_bind)))
    threads = []
    for port in target_ports:
        t = threading.Thread(target=run_server_instance, args=(port,), daemon=True)
        t.start()
        threads.append(t)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[CREDGEN-SERVER] Server terminated gracefully.")

if __name__ == '__main__':
    main()

