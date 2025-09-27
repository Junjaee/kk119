import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');
const db = new Database(dbPath);

try {
  console.log('📋 association_members table schema:');
  const membershipSchema = db.prepare("PRAGMA table_info(association_members)").all();
  if (membershipSchema.length > 0) {
    membershipSchema.forEach(col => {
      console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });

    console.log('\n📊 Current association_members content:');
    const memberships = db.prepare("SELECT * FROM association_members").all();
    console.log(`Total records: ${memberships.length}`);
    memberships.forEach(membership => {
      console.log(`- ID: ${membership.id}, User: ${membership.user_id}, Association: ${membership.association_id}, Status: ${membership.status}`);
    });
  } else {
    console.log('❌ association_members table does not exist!');
  }

  console.log('\n📋 Users with associations:');
  const usersWithAssociations = db.prepare("SELECT id, email, name, association, association_id FROM users WHERE association IS NOT NULL OR association_id IS NOT NULL").all();
  console.log(`Total users with associations: ${usersWithAssociations.length}`);
  usersWithAssociations.forEach(user => {
    console.log(`- User ${user.id} (${user.email}): association_id=${user.association_id}, association=${user.association}`);
  });

  console.log('\n📋 All tables in the database:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(table => {
    console.log(`- ${table.name}`);
  });

} finally {
  db.close();
}