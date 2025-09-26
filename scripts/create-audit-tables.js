const Database = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.join(__dirname, '../data/kyokwon119.db');
  const db = new Database(dbPath);

  console.log('=== Creating Audit Tables ===\n');

  // Begin transaction
  db.exec('BEGIN TRANSACTION');

  try {
    // Step 1: Create audit_logs table
    console.log('Step 1: Creating audit_logs table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        resource_id VARCHAR(100),
        details TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        session_id VARCHAR(255),
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ audit_logs table created successfully');

    // Step 2: Create security_events table
    console.log('Step 2: Creating security_events table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
        user_id INTEGER,
        ip_address VARCHAR(45),
        description TEXT NOT NULL,
        metadata TEXT,
        resolved BOOLEAN DEFAULT FALSE,
        resolved_by INTEGER,
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ security_events table created successfully');

    // Step 3: Create login_attempts table
    console.log('Step 3: Creating login_attempts table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        success BOOLEAN NOT NULL,
        failure_reason VARCHAR(100),
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ login_attempts table created successfully');

    // Step 4: Create session_logs table
    console.log('Step 4: Creating session_logs table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS session_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        action VARCHAR(20) NOT NULL CHECK(action IN ('login', 'logout', 'expired')),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ session_logs table created successfully');

    // Step 5: Create indexes for performance
    console.log('Step 5: Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, resource_id)',
      'CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type)',
      'CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity)',
      'CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved)',
      'CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email)',
      'CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address)',
      'CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON login_attempts(success)',
      'CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_session_logs_user_id ON session_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON session_logs(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_session_logs_action ON session_logs(action)',
      'CREATE INDEX IF NOT EXISTS idx_session_logs_created_at ON session_logs(created_at)'
    ];

    indexes.forEach((indexSQL, i) => {
      db.exec(indexSQL);
      console.log(`  ✅ Index ${i + 1}/${indexes.length} created`);
    });

    // Step 6: Insert sample audit log entries
    console.log('Step 6: Inserting sample audit data...');

    const sampleAuditLogs = [
      {
        user_id: 1,
        action: 'login',
        resource: 'auth',
        details: 'User logged in successfully',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: 1
      },
      {
        user_id: 1,
        action: 'user_create',
        resource: 'users',
        resource_id: '2',
        details: 'Created new admin user',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: 1
      },
      {
        user_id: null,
        action: 'login_failed',
        resource: 'auth',
        details: 'Failed login attempt - invalid credentials',
        ip_address: '192.168.1.200',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: 0,
        error_message: 'Invalid email or password'
      }
    ];

    const insertAuditLog = db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address, user_agent, success, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    sampleAuditLogs.forEach(log => {
      insertAuditLog.run(
        log.user_id,
        log.action,
        log.resource,
        log.resource_id || null,
        log.details,
        log.ip_address,
        log.user_agent,
        log.success,
        log.error_message || null
      );
    });
    console.log('✅ Sample audit logs inserted');

    // Sample security events
    const sampleSecurityEvents = [
      {
        event_type: 'suspicious_login',
        severity: 'medium',
        user_id: null,
        ip_address: '192.168.1.200',
        description: 'Multiple failed login attempts from same IP',
        metadata: JSON.stringify({ attempts: 5, timeframe: '5 minutes' })
      },
      {
        event_type: 'privilege_escalation',
        severity: 'high',
        user_id: 1,
        ip_address: '192.168.1.100',
        description: 'User role changed to super_admin',
        metadata: JSON.stringify({ from_role: 'admin', to_role: 'super_admin' })
      }
    ];

    const insertSecurityEvent = db.prepare(`
      INSERT INTO security_events (event_type, severity, user_id, ip_address, description, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    sampleSecurityEvents.forEach(event => {
      insertSecurityEvent.run(
        event.event_type,
        event.severity,
        event.user_id,
        event.ip_address,
        event.description,
        event.metadata
      );
    });
    console.log('✅ Sample security events inserted');

    // Commit transaction
    db.exec('COMMIT');
    console.log('✅ All audit tables created successfully!\n');

    // Show table information
    console.log('=== Database Schema Summary ===');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%audit%' OR name LIKE '%security%' OR name LIKE '%login%' OR name LIKE '%session%' ORDER BY name").all();
    console.log('Created tables:', tables.map(t => t.name).join(', '));
    console.log('');

    // Show sample data counts
    console.log('=== Data Summary ===');
    const dataSummary = [
      { table: 'audit_logs', count: db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count },
      { table: 'security_events', count: db.prepare('SELECT COUNT(*) as count FROM security_events').get().count },
      { table: 'login_attempts', count: db.prepare('SELECT COUNT(*) as count FROM login_attempts').get().count },
      { table: 'session_logs', count: db.prepare('SELECT COUNT(*) as count FROM session_logs').get().count }
    ];

    console.table(dataSummary);

  } catch (createError) {
    // Rollback on error
    db.exec('ROLLBACK');
    console.error('❌ Table creation failed, rolled back:', createError.message);
    throw createError;
  }

  db.close();
  console.log('\n🎉 Audit tables creation completed successfully!');

} catch (error) {
  console.error('❌ Database error:', error.message);
  process.exit(1);
}