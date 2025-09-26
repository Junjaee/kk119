// Association Management Service
// 협회 관리 관련 비즈니스 로직을 담당하는 서비스

import Database from 'better-sqlite3';
import path from 'path';

// Types
export interface Association {
  id: number;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  established_date?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: number;
  user_id: number;
  association_id: number;
  permissions?: string; // JSON string
  created_at: string;
}

export interface Lawyer {
  id: number;
  user_id: number;
  license_number?: string;
  specialties?: string; // JSON string array
  experience_years?: number;
  created_at: string;
}

export interface AssociationMember {
  id: number;
  user_id: number;
  association_id: number;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface BoardCategory {
  id: number;
  name: string;
  description?: string;
  is_association_restricted: boolean;
  created_at: string;
}

export interface BoardPermission {
  id: number;
  association_id: number;
  board_category_id: number;
  is_accessible: boolean;
  created_at: string;
}

class AssociationService {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(process.cwd(), 'data', 'kyokwon119.db');
    this.db = new Database(dbPath);
    this.db.pragma('foreign_keys = ON');
  }

  // ========== ASSOCIATION METHODS ==========

  // 협회 생성
  createAssociation(data: Omit<Association, 'id' | 'created_at' | 'updated_at'>): Association | null {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO associations (name, code, description, address, phone, email, website, established_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        data.name,
        data.code,
        data.description || null,
        data.address || null,
        data.phone || null,
        data.email || null,
        data.website || null,
        data.established_date || null,
        data.status || 'active'
      );

      return this.getAssociationById(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error creating association:', error);
      return null;
    }
  }

  // 협회 조회 (ID로)
  getAssociationById(id: number): Association | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM associations WHERE id = ?');
      return stmt.get(id) as Association || null;
    } catch (error) {
      console.error('Error getting association by ID:', error);
      return null;
    }
  }

  // 협회 조회 (코드로)
  getAssociationByCode(code: string): Association | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM associations WHERE code = ?');
      return stmt.get(code) as Association || null;
    } catch (error) {
      console.error('Error getting association by code:', error);
      return null;
    }
  }

  // 모든 협회 조회
  getAllAssociations(status?: 'active' | 'inactive'): Association[] {
    try {
      let query = 'SELECT * FROM associations';
      let params: any[] = [];

      if (status) {
        query += ' WHERE status = ?';
        params = [status];
      }

      query += ' ORDER BY name';

      const stmt = this.db.prepare(query);
      return stmt.all(...params) as Association[];
    } catch (error) {
      console.error('Error getting all associations:', error);
      return [];
    }
  }

  // 협회 업데이트
  updateAssociation(id: number, updates: Partial<Omit<Association, 'id' | 'code' | 'created_at'>>): Association | null {
    try {
      const fields = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
      if (fields.length === 0) return this.getAssociationById(id);

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updates[field as keyof typeof updates]);

      const stmt = this.db.prepare(`
        UPDATE associations
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(...values, id);
      return this.getAssociationById(id);
    } catch (error) {
      console.error('Error updating association:', error);
      return null;
    }
  }

  // 협회 삭제 (soft delete)
  deleteAssociation(id: number): boolean {
    try {
      // Check if association has members or admins
      const memberCount = this.db.prepare('SELECT COUNT(*) as count FROM association_members WHERE association_id = ?').get(id) as { count: number };
      const adminCount = this.db.prepare('SELECT COUNT(*) as count FROM admins WHERE association_id = ?').get(id) as { count: number };

      if (memberCount.count > 0 || adminCount.count > 0) {
        console.error('Cannot delete association with existing members or admins');
        return false;
      }

      const stmt = this.db.prepare('UPDATE associations SET status = ? WHERE id = ?');
      const result = stmt.run('inactive', id);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting association:', error);
      return false;
    }
  }

  // 협회 코드 자동 생성
  generateAssociationCode(name: string): string {
    const baseCode = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    let counter = 1;
    let code: string;

    do {
      code = `${baseCode}${String(counter).padStart(3, '0')}`;
      counter++;
    } while (this.getAssociationByCode(code) !== null);

    return code;
  }

  // ========== ADMIN METHODS ==========

  // 관리자 생성
  createAdmin(data: Omit<Admin, 'id' | 'created_at'>): Admin | null {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO admins (user_id, association_id, permissions)
        VALUES (?, ?, ?)
      `);

      const result = stmt.run(
        data.user_id,
        data.association_id,
        data.permissions || null
      );

      return this.getAdminById(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error creating admin:', error);
      return null;
    }
  }

  // 관리자 조회 (ID로)
  getAdminById(id: number): Admin | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM admins WHERE id = ?');
      return stmt.get(id) as Admin || null;
    } catch (error) {
      console.error('Error getting admin by ID:', error);
      return null;
    }
  }

  // 관리자 조회 (사용자 ID로)
  getAdminByUserId(userId: number): Admin | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM admins WHERE user_id = ?');
      return stmt.get(userId) as Admin || null;
    } catch (error) {
      console.error('Error getting admin by user ID:', error);
      return null;
    }
  }

  // 협회별 관리자 목록 조회
  getAdminsByAssociation(associationId: number): Admin[] {
    try {
      const stmt = this.db.prepare(`
        SELECT a.*, u.name, u.email
        FROM admins a
        JOIN users u ON a.user_id = u.id
        WHERE a.association_id = ?
        ORDER BY a.created_at
      `);
      return stmt.all(associationId) as Admin[];
    } catch (error) {
      console.error('Error getting admins by association:', error);
      return [];
    }
  }

  // 관리자 권한 업데이트
  updateAdminPermissions(id: number, permissions: any): Admin | null {
    try {
      const stmt = this.db.prepare('UPDATE admins SET permissions = ? WHERE id = ?');
      stmt.run(JSON.stringify(permissions), id);
      return this.getAdminById(id);
    } catch (error) {
      console.error('Error updating admin permissions:', error);
      return null;
    }
  }

  // 관리자 삭제
  deleteAdmin(id: number): boolean {
    try {
      const stmt = this.db.prepare('DELETE FROM admins WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting admin:', error);
      return false;
    }
  }

  // ========== LAWYER METHODS ==========

  // 변호사 생성
  createLawyer(data: Omit<Lawyer, 'id' | 'created_at'>): Lawyer | null {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO lawyers (user_id, license_number, specialties, experience_years)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(
        data.user_id,
        data.license_number || null,
        data.specialties || null,
        data.experience_years || null
      );

      return this.getLawyerById(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error creating lawyer:', error);
      return null;
    }
  }

  // 변호사 조회 (ID로)
  getLawyerById(id: number): Lawyer | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM lawyers WHERE id = ?');
      return stmt.get(id) as Lawyer || null;
    } catch (error) {
      console.error('Error getting lawyer by ID:', error);
      return null;
    }
  }

  // 변호사 조회 (사용자 ID로)
  getLawyerByUserId(userId: number): Lawyer | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM lawyers WHERE user_id = ?');
      return stmt.get(userId) as Lawyer || null;
    } catch (error) {
      console.error('Error getting lawyer by user ID:', error);
      return null;
    }
  }

  // 모든 변호사 조회
  getAllLawyers(): Lawyer[] {
    try {
      const stmt = this.db.prepare(`
        SELECT l.*, u.name, u.email
        FROM lawyers l
        JOIN users u ON l.user_id = u.id
        ORDER BY l.experience_years DESC
      `);
      return stmt.all() as Lawyer[];
    } catch (error) {
      console.error('Error getting all lawyers:', error);
      return [];
    }
  }

  // 변호사 업데이트
  updateLawyer(id: number, updates: Partial<Omit<Lawyer, 'id' | 'user_id' | 'created_at'>>): Lawyer | null {
    try {
      const fields = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
      if (fields.length === 0) return this.getLawyerById(id);

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updates[field as keyof typeof updates]);

      const stmt = this.db.prepare(`UPDATE lawyers SET ${setClause} WHERE id = ?`);
      stmt.run(...values, id);
      return this.getLawyerById(id);
    } catch (error) {
      console.error('Error updating lawyer:', error);
      return null;
    }
  }

  // 변호사 삭제
  deleteLawyer(id: number): boolean {
    try {
      const stmt = this.db.prepare('DELETE FROM lawyers WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting lawyer:', error);
      return false;
    }
  }

  // ========== ASSOCIATION MEMBER METHODS ==========

  // 협회 회원 신청
  createMembershipRequest(userId: number, associationId: number): AssociationMember | null {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO association_members (user_id, association_id, status)
        VALUES (?, ?, 'pending')
      `);

      const result = stmt.run(userId, associationId);
      return this.getAssociationMemberById(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error creating membership request:', error);
      return null;
    }
  }

  // 협회 회원 조회 (ID로)
  getAssociationMemberById(id: number): AssociationMember | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM association_members WHERE id = ?');
      return stmt.get(id) as AssociationMember || null;
    } catch (error) {
      console.error('Error getting association member by ID:', error);
      return null;
    }
  }

  // 사용자의 협회 멤버십 조회
  getMembershipByUser(userId: number, associationId: number): AssociationMember | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM association_members WHERE user_id = ? AND association_id = ?');
      return stmt.get(userId, associationId) as AssociationMember || null;
    } catch (error) {
      console.error('Error getting membership by user:', error);
      return null;
    }
  }

  // 협회의 승인 대기 멤버 목록
  getPendingMembers(associationId: number): AssociationMember[] {
    try {
      const stmt = this.db.prepare(`
        SELECT am.*, u.name, u.email, u.school, u.position
        FROM association_members am
        JOIN users u ON am.user_id = u.id
        WHERE am.association_id = ? AND am.status = 'pending'
        ORDER BY am.created_at
      `);
      return stmt.all(associationId) as AssociationMember[];
    } catch (error) {
      console.error('Error getting pending members:', error);
      return [];
    }
  }

  // 협회의 승인된 멤버 목록
  getApprovedMembers(associationId: number): AssociationMember[] {
    try {
      const stmt = this.db.prepare(`
        SELECT am.*, u.name, u.email, u.school, u.position
        FROM association_members am
        JOIN users u ON am.user_id = u.id
        WHERE am.association_id = ? AND am.status = 'approved'
        ORDER BY am.approved_at DESC
      `);
      return stmt.all(associationId) as AssociationMember[];
    } catch (error) {
      console.error('Error getting approved members:', error);
      return [];
    }
  }

  // 회원 승인
  approveMember(id: number, approvedBy: number): AssociationMember | null {
    try {
      const stmt = this.db.prepare(`
        UPDATE association_members
        SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(approvedBy, id);
      return this.getAssociationMemberById(id);
    } catch (error) {
      console.error('Error approving member:', error);
      return null;
    }
  }

  // 회원 거부
  rejectMember(id: number, approvedBy: number, reason: string): AssociationMember | null {
    try {
      const stmt = this.db.prepare(`
        UPDATE association_members
        SET status = 'rejected', approved_by = ?, rejection_reason = ?, approved_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(approvedBy, reason, id);
      return this.getAssociationMemberById(id);
    } catch (error) {
      console.error('Error rejecting member:', error);
      return null;
    }
  }

  // ========== BOARD PERMISSION METHODS ==========

  // 게시판 카테고리 조회
  getAllBoardCategories(): BoardCategory[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM board_categories ORDER BY id');
      return stmt.all() as BoardCategory[];
    } catch (error) {
      console.error('Error getting board categories:', error);
      return [];
    }
  }

  // 협회별 접근 가능한 게시판 조회
  getAccessibleBoards(associationId: number): BoardCategory[] {
    try {
      const stmt = this.db.prepare(`
        SELECT bc.*
        FROM board_categories bc
        LEFT JOIN association_board_permissions abp ON bc.id = abp.board_category_id AND abp.association_id = ?
        WHERE bc.is_association_restricted = 0
           OR (bc.is_association_restricted = 1 AND abp.is_accessible = 1)
        ORDER BY bc.id
      `);
      return stmt.all(associationId) as BoardCategory[];
    } catch (error) {
      console.error('Error getting accessible boards:', error);
      return [];
    }
  }

  // 게시판 권한 업데이트
  updateBoardPermission(associationId: number, boardCategoryId: number, isAccessible: boolean): boolean {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO association_board_permissions (association_id, board_category_id, is_accessible)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(associationId, boardCategoryId, isAccessible ? 1 : 0);
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating board permission:', error);
      return false;
    }
  }

  // ========== UTILITY METHODS ==========

  // 데이터베이스 연결 종료
  close(): void {
    this.db.close();
  }

  // 통계 정보 조회
  getStatistics(): any {
    try {
      const stats = {
        totalAssociations: this.db.prepare('SELECT COUNT(*) as count FROM associations WHERE status = "active"').get() as { count: number },
        totalAdmins: this.db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number },
        totalLawyers: this.db.prepare('SELECT COUNT(*) as count FROM lawyers').get() as { count: number },
        pendingMembers: this.db.prepare('SELECT COUNT(*) as count FROM association_members WHERE status = "pending"').get() as { count: number },
        approvedMembers: this.db.prepare('SELECT COUNT(*) as count FROM association_members WHERE status = "approved"').get() as { count: number }
      };

      return {
        totalAssociations: stats.totalAssociations.count,
        totalAdmins: stats.totalAdmins.count,
        totalLawyers: stats.totalLawyers.count,
        pendingMembers: stats.pendingMembers.count,
        approvedMembers: stats.approvedMembers.count
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {};
    }
  }
}

// 싱글톤 인스턴스
export const associationService = new AssociationService();

// 기본 export
export default associationService;