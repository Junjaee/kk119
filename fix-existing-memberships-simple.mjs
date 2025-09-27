import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');

function createMembershipApplications() {
  const db = new Database(dbPath);

  try {
    console.log('🔄 [MEMBERSHIP-SYNC] Creating missing membership applications...');

    // Find users with associations but no membership records
    const usersWithAssociations = db.prepare(`
      SELECT u.id, u.email, u.name, u.association, u.association_id
      FROM users u
      LEFT JOIN association_members am ON u.id = am.user_id
      WHERE (u.association IS NOT NULL AND u.association != '[]' AND u.association != 'null')
         OR u.association_id IS NOT NULL
      AND am.id IS NULL
    `).all();

    console.log(`Found ${usersWithAssociations.length} users needing membership applications`);

    let created = 0;
    const insertStmt = db.prepare(`
      INSERT INTO association_members (user_id, association_id, status, created_at)
      VALUES (?, ?, 'pending', datetime('now'))
    `);

    usersWithAssociations.forEach((user) => {
      try {
        let associationIds = [];

        // Get association IDs from either association_id or association JSON
        if (user.association_id) {
          associationIds.push(user.association_id);
        } else if (user.association) {
          try {
            const associations = JSON.parse(user.association);
            if (Array.isArray(associations)) {
              associationIds = associations.filter(id => typeof id === 'number' && id > 0);
            }
          } catch (error) {
            console.warn(`Failed to parse associations for user ${user.id}:`, error);
          }
        }

        // Create membership applications
        associationIds.forEach(associationId => {
          try {
            insertStmt.run(user.id, associationId);
            console.log(`✅ Created membership application for user ${user.email} -> association ${associationId}`);
            created++;
          } catch (error) {
            if (error.code !== 'SQLITE_CONSTRAINT_UNIQUE') {
              console.error(`Failed to create membership for user ${user.id}, association ${associationId}:`, error);
            }
          }
        });

      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
      }
    });

    console.log(`🎉 [MEMBERSHIP-SYNC] Created ${created} membership applications`);
    return { created, total: usersWithAssociations.length };

  } finally {
    db.close();
  }
}

console.log('🔄 Running membership sync for existing users...');

try {
  const result = createMembershipApplications();
  console.log('📊 Sync results:', result);
  console.log('✅ Membership sync completed successfully!');
} catch (error) {
  console.error('❌ Membership sync failed:', error);
}