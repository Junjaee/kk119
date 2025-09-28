/**
 * Report Repository Implementation
 * Following Single Responsibility Principle - only handles report operations
 */

import { IReportRepository, Report } from '../interfaces';
import { idGenerationService } from '../id-generation-service';
import { STORAGE_KEYS, ERROR_MESSAGES, REPORT_STATUS, ReportStatusType } from '../constants';

/**
 * LocalStorage-based Report Repository
 * Following Single Responsibility Principle
 */
export class LocalReportRepository implements IReportRepository {
  /**
   * Get all reports from localStorage
   */
  async getAllReports(): Promise<Report[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading reports from localStorage:', error);
      return [];
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(id: string): Promise<Report | null> {
    const reports = await this.getAllReports();
    return reports.find(report => report.id === id) || null;
  }

  /**
   * Create new report
   */
  async createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Report | null> {
    const reports = await this.getAllReports();

    const newReport: Report = {
      ...reportData,
      id: idGenerationService.generateReportId(),
      status: REPORT_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reports.push(newReport);
    await this.saveReports(reports);

    return newReport;
  }

  /**
   * Update report
   */
  async updateReport(id: string, updates: Partial<Omit<Report, 'id' | 'createdAt'>>): Promise<Report | null> {
    const reports = await this.getAllReports();
    const index = reports.findIndex(report => report.id === id);

    if (index === -1) {
      return null;
    }

    reports[index] = {
      ...reports[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveReports(reports);
    return reports[index];
  }

  /**
   * Delete report
   */
  async deleteReport(id: string): Promise<boolean> {
    const reports = await this.getAllReports();
    const filteredReports = reports.filter(report => report.id !== id);

    if (filteredReports.length === reports.length) {
      return false; // Report not found
    }

    await this.saveReports(filteredReports);
    return true;
  }

  /**
   * Get reports by status
   */
  async getReportsByStatus(status: ReportStatusType): Promise<Report[]> {
    const reports = await this.getAllReports();
    return reports.filter(report => report.status === status);
  }

  /**
   * Get reports count by status
   */
  async getReportsCountByStatus(): Promise<{ pending: number; processing: number; resolved: number; rejected: number }> {
    const reports = await this.getAllReports();

    return {
      pending: reports.filter(r => r.status === REPORT_STATUS.PENDING).length,
      processing: reports.filter(r => r.status === REPORT_STATUS.PROCESSING).length,
      resolved: reports.filter(r => r.status === REPORT_STATUS.RESOLVED).length,
      rejected: reports.filter(r => r.status === REPORT_STATUS.REJECTED).length
    };
  }

  /**
   * Clear all reports (use with caution)
   */
  async clearAllReports(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
  }

  /**
   * Save reports to localStorage
   * Following Single Responsibility Principle
   */
  private async saveReports(reports: Report[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving reports to localStorage:', error);
      throw new Error(ERROR_MESSAGES.FAILED_TO_SAVE_REPORT);
    }
  }

  /**
   * Initialize with sample data (for development/demo)
   */
  async initWithSampleData(): Promise<void> {
    const existingReports = await this.getAllReports();

    if (existingReports.length === 0) {
      const sampleReports: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>[] = [
        {
          type: 'parent',
          title: '학부모 폭언 및 협박 사건',
          incident_date: '2024-03-15',
          incident_time: '14:30',
          location: '3학년 2반 교실',
          witnesses: '김○○ 선생님, 이○○ 선생님',
          content: '학생 성적 문제로 찾아온 학부모가 교실에서 큰소리로 폭언을 하며 협박하는 일이 발생했습니다. 수업 중이었으며 학생들이 모두 목격했습니다.',
          desired_action: '법적 조치 및 학교 차원의 보호 조치',
          fileNames: []
        },
        {
          type: 'student',
          title: '학생의 수업 방해 및 폭력 행위',
          incident_date: '2024-03-10',
          incident_time: '10:20',
          location: '음악실',
          witnesses: '박○○ 학생 외 3명',
          content: '수업 중 학생이 지속적으로 수업을 방해하고, 제지하는 과정에서 교사를 밀치는 등의 폭력 행위가 있었습니다.',
          desired_action: '학생 상담 및 학부모 면담',
          fileNames: ['incident_report.pdf']
        },
        {
          type: 'verbal',
          title: '온라인 수업 중 욕설 사건',
          incident_date: '2024-03-05',
          incident_time: '09:00',
          location: '온라인 수업 (Zoom)',
          witnesses: '수업 참여 학생 전원',
          content: '온라인 수업 중 특정 학생이 채팅창에 교사를 향한 욕설을 반복적으로 게시했습니다. 화면 캡처 자료 보유.',
          desired_action: '학생 징계 및 사과 요구',
          fileNames: ['screenshot1.png', 'screenshot2.png']
        }
      ];

      for (const report of sampleReports) {
        await this.createReport(report);
      }
    }
  }
}