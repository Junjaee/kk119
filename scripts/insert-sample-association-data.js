const Database = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.join(__dirname, '../data/kyokwon119.db');
  const db = new Database(dbPath);

  console.log('=== Inserting Sample Association Data ===\n');

  // Begin transaction
  db.exec('BEGIN TRANSACTION');

  try {
    // Clear existing sample data first
    console.log('Clearing existing sample data...');
    db.exec('DELETE FROM association_board_permissions');
    db.exec('DELETE FROM board_categories');
    db.exec('DELETE FROM association_members');
    db.exec('DELETE FROM admins');
    db.exec('DELETE FROM lawyers');
    db.exec('DELETE FROM associations');
    console.log('✅ Existing sample data cleared\n');

    // Step 1: Insert sample associations
    console.log('Step 1: Inserting sample associations...');
    const insertAssociation = db.prepare(`
      INSERT INTO associations (name, code, description, address, phone, email, website, established_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleAssociations = [
      {
        name: '서울교사협회',
        code: 'SEOUL001',
        description: '서울시 교사들을 위한 협회',
        address: '서울시 중구 세종대로 110',
        phone: '02-1234-5678',
        email: 'info@seoul-teachers.kr',
        website: 'https://seoul-teachers.kr',
        established_date: '2020-01-15'
      },
      {
        name: '부산교사협회',
        code: 'BUSAN001',
        description: '부산시 교사들을 위한 협회',
        address: '부산시 해운대구 해운대로 264',
        phone: '051-1234-5678',
        email: 'info@busan-teachers.kr',
        website: 'https://busan-teachers.kr',
        established_date: '2019-03-20'
      },
      {
        name: '경기교사협회',
        code: 'GYEONGGI001',
        description: '경기도 교사들을 위한 협회',
        address: '경기도 수원시 영통구 월드컵로 206',
        phone: '031-1234-5678',
        email: 'info@gyeonggi-teachers.kr',
        website: 'https://gyeonggi-teachers.kr',
        established_date: '2018-05-10'
      }
    ];

    sampleAssociations.forEach(assoc => {
      insertAssociation.run(
        assoc.name,
        assoc.code,
        assoc.description,
        assoc.address,
        assoc.phone,
        assoc.email,
        assoc.website,
        assoc.established_date
      );
    });
    console.log('✅ Sample associations inserted\n');

    // Step 2: Insert sample board categories
    console.log('Step 2: Inserting board categories...');
    const insertBoardCategory = db.prepare(`
      INSERT INTO board_categories (name, description, is_association_restricted)
      VALUES (?, ?, ?)
    `);

    const sampleBoardCategories = [
      { name: '공지사항', description: '전체 공지사항', is_association_restricted: false },
      { name: '자유게시판', description: '자유로운 의견 교환', is_association_restricted: false },
      { name: '법률상담', description: '법률 관련 상담', is_association_restricted: false },
      { name: '자료실', description: '공용 자료 공유', is_association_restricted: false },
      { name: '협회 공지사항', description: '협회별 공지사항', is_association_restricted: true },
      { name: '협회 전용 게시판', description: '협회 회원 전용 게시판', is_association_restricted: true },
      { name: '협회 자료실', description: '협회별 자료 공유', is_association_restricted: true },
      { name: '내부 소통', description: '협회 내부 소통 게시판', is_association_restricted: true }
    ];

    sampleBoardCategories.forEach(category => {
      insertBoardCategory.run(
        category.name,
        category.description,
        category.is_association_restricted ? 1 : 0
      );
    });
    console.log('✅ Sample board categories inserted\n');

    // Step 3: Insert association board permissions
    console.log('Step 3: Setting up board permissions...');
    const insertBoardPermission = db.prepare(`
      INSERT INTO association_board_permissions (association_id, board_category_id, is_accessible)
      VALUES (?, ?, ?)
    `);

    // Get association IDs and restricted board category IDs
    const associations = db.prepare('SELECT id FROM associations').all();
    const restrictedCategories = db.prepare('SELECT id FROM board_categories WHERE is_association_restricted = 1').all();

    let permissionCount = 0;
    associations.forEach(assoc => {
      restrictedCategories.forEach(category => {
        insertBoardPermission.run(assoc.id, category.id, 1);
        permissionCount++;
      });
    });
    console.log(`✅ ${permissionCount} board permissions set up\n`);

    // Step 4: Set up some sample admins and lawyers based on existing users
    console.log('Step 4: Setting up sample admin and lawyer roles...');

    // Get existing users with admin and lawyer roles
    const adminUsers = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
    const lawyerUsers = db.prepare("SELECT id FROM users WHERE role = 'lawyer'").all();
    const seoulAssoc = db.prepare("SELECT id FROM associations WHERE code = 'SEOUL001'").get();

    // Insert admin records
    if (adminUsers.length > 0 && seoulAssoc) {
      const insertAdmin = db.prepare(`
        INSERT INTO admins (user_id, association_id, permissions)
        VALUES (?, ?, ?)
      `);

      adminUsers.forEach(user => {
        insertAdmin.run(
          user.id,
          seoulAssoc.id,
          JSON.stringify({
            can_approve_members: true,
            can_manage_boards: true,
            can_view_reports: true
          })
        );
      });
      console.log(`✅ ${adminUsers.length} admin records created`);
    }

    // Insert lawyer records
    if (lawyerUsers.length > 0) {
      const insertLawyer = db.prepare(`
        INSERT INTO lawyers (user_id, license_number, specialties, experience_years)
        VALUES (?, ?, ?, ?)
      `);

      lawyerUsers.forEach((user, index) => {
        insertLawyer.run(
          user.id,
          `LAW${String(index + 1).padStart(4, '0')}`,
          JSON.stringify(['교육법', '노동법', '민사법']),
          5 + index
        );
      });
      console.log(`✅ ${lawyerUsers.length} lawyer records created`);
    }

    // Commit transaction
    db.exec('COMMIT');
    console.log('✅ Sample data insertion completed successfully!\n');

    // Show summary
    console.log('=== Final Data Summary ===');
    const dataSummary = [
      { table: 'associations', count: db.prepare('SELECT COUNT(*) as count FROM associations').get().count },
      { table: 'admins', count: db.prepare('SELECT COUNT(*) as count FROM admins').get().count },
      { table: 'lawyers', count: db.prepare('SELECT COUNT(*) as count FROM lawyers').get().count },
      { table: 'association_members', count: db.prepare('SELECT COUNT(*) as count FROM association_members').get().count },
      { table: 'board_categories', count: db.prepare('SELECT COUNT(*) as count FROM board_categories').get().count },
      { table: 'association_board_permissions', count: db.prepare('SELECT COUNT(*) as count FROM association_board_permissions').get().count }
    ];

    console.table(dataSummary);

    // Show associations
    console.log('\n=== Created Associations ===');
    const associations_list = db.prepare('SELECT id, name, code, status FROM associations').all();
    console.table(associations_list);

    // Show board categories
    console.log('\n=== Board Categories ===');
    const boardCats = db.prepare('SELECT id, name, is_association_restricted FROM board_categories').all();
    console.table(boardCats);

    // Show admin/lawyer assignments
    if (adminUsers.length > 0) {
      console.log('\n=== Admin Assignments ===');
      const adminAssignments = db.prepare(`
        SELECT a.id, u.name, u.email, ass.name as association_name
        FROM admins a
        JOIN users u ON a.user_id = u.id
        JOIN associations ass ON a.association_id = ass.id
      `).all();
      console.table(adminAssignments);
    }

    if (lawyerUsers.length > 0) {
      console.log('\n=== Lawyer Records ===');
      const lawyerRecords = db.prepare(`
        SELECT l.id, u.name, u.email, l.license_number, l.experience_years
        FROM lawyers l
        JOIN users u ON l.user_id = u.id
      `).all();
      console.table(lawyerRecords);
    }

  } catch (insertError) {
    db.exec('ROLLBACK');
    console.error('❌ Sample data insertion failed, rolled back:', insertError.message);
    throw insertError;
  }

  db.close();
  console.log('\n🎉 All sample data inserted successfully!');

} catch (error) {
  console.error('❌ Database error:', error.message);
  process.exit(1);
}