// @CODE:CONSULT-001 | Chain: SPEC-CONSULT-001 -> CODE-CONSULT-001 -> TEST-CONSULT-MATCH-001
// CODE-CONSULT-001: Matching algorithm service for lawyer assignment
import Database from 'better-sqlite3';
import {
  MatchingScore,
  ConsultCategory,
  ConsultUrgency,
} from '@/lib/types/consult';
import {
  MATCHING_WEIGHTS,
  WORKLOAD_SCORES,
  RESPONSE_RATE_SCORES,
  URGENCY_BONUS,
  SPECIALTY_MATCH_SCORES,
  SYSTEM_LIMITS,
} from '@/lib/constants/consult-constants';

export class MatchingService {
  constructor(private db: Database.Database) {}

  /**
   * Calculate specialty match score for a lawyer
   * CODE-CONSULT-001:DOMAIN - Specialty matching logic
   */
  async calculateSpecialtyScore(
    lawyerId: number,
    category: ConsultCategory
  ): Promise<number> {
    const specialties = this.db
      .prepare(
        `
      SELECT specialty, is_primary
      FROM lawyer_specialties
      WHERE lawyer_id = ?
    `
      )
      .all(lawyerId) as Array<{ specialty: string; is_primary: number }>;

    // Exact primary match
    if (specialties.some((s) => s.specialty === category && s.is_primary)) {
      return SPECIALTY_MATCH_SCORES.EXACT;
    }

    // Partial match (non-primary specialty)
    if (specialties.some((s) => s.specialty === category)) {
      return SPECIALTY_MATCH_SCORES.PARTIAL;
    }

    // No match
    return SPECIALTY_MATCH_SCORES.NONE;
  }

  /**
   * Calculate workload balance score for a lawyer
   * CODE-CONSULT-001:DOMAIN - Workload calculation
   */
  async calculateWorkloadScore(lawyerId: number): Promise<number> {
    const result = this.db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM consults
      WHERE lawyer_id = ?
        AND status IN ('assigned', 'in_progress')
    `
      )
      .get(lawyerId) as { count: number };

    const activeConsultations = result.count;
    const workloadPercentage =
      (activeConsultations / SYSTEM_LIMITS.MAX_CONSULTATIONS_PER_LAWYER) * 100;

    if (workloadPercentage <= 20) return WORKLOAD_SCORES['0-20'];
    if (workloadPercentage <= 40) return WORKLOAD_SCORES['21-40'];
    if (workloadPercentage <= 60) return WORKLOAD_SCORES['41-60'];
    if (workloadPercentage <= 80) return WORKLOAD_SCORES['61-80'];

    // 81-100% - not assignable
    return WORKLOAD_SCORES['81-100'];
  }

  /**
   * Calculate response rate score for a lawyer
   * CODE-CONSULT-001:DOMAIN - Response rate calculation
   */
  async calculateResponseRateScore(lawyerId: number): Promise<number> {
    const result = this.db
      .prepare(
        `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('completed', 'closed') THEN 1 ELSE 0 END) as completed
      FROM consults
      WHERE lawyer_id = ?
    `
      )
      .get(lawyerId) as { total: number; completed: number };

    if (result.total === 0) {
      // New lawyers get excellent score
      return RESPONSE_RATE_SCORES.EXCELLENT.score;
    }

    const responseRate = (result.completed / result.total) * 100;

    if (responseRate >= RESPONSE_RATE_SCORES.EXCELLENT.min) {
      return RESPONSE_RATE_SCORES.EXCELLENT.score;
    }
    if (responseRate >= RESPONSE_RATE_SCORES.GOOD.min) {
      return RESPONSE_RATE_SCORES.GOOD.score;
    }
    if (responseRate >= RESPONSE_RATE_SCORES.FAIR.min) {
      return RESPONSE_RATE_SCORES.FAIR.score;
    }

    return RESPONSE_RATE_SCORES.POOR.score;
  }

  /**
   * Calculate urgency bonus points
   * CODE-CONSULT-001:DOMAIN - Urgency calculation
   */
  calculateUrgencyBonus(urgency: ConsultUrgency): number {
    return URGENCY_BONUS[urgency];
  }

  /**
   * Calculate total weighted matching score for a lawyer
   * CODE-CONSULT-001:DOMAIN - Total score aggregation
   */
  async calculateMatchingScore(
    lawyerId: number,
    category: ConsultCategory,
    urgency: ConsultUrgency
  ): Promise<MatchingScore> {
    const specialtyScore = await this.calculateSpecialtyScore(lawyerId, category);
    const workloadScore = await this.calculateWorkloadScore(lawyerId);
    const responseRateScore = await this.calculateResponseRateScore(lawyerId);
    const urgencyBonus = this.calculateUrgencyBonus(urgency);

    const totalScore =
      specialtyScore * MATCHING_WEIGHTS.SPECIALTY +
      workloadScore * MATCHING_WEIGHTS.WORKLOAD +
      responseRateScore * MATCHING_WEIGHTS.RESPONSE_RATE +
      urgencyBonus * MATCHING_WEIGHTS.URGENCY;

    return {
      lawyer_id: lawyerId,
      specialty_score: specialtyScore,
      workload_score: workloadScore,
      response_rate_score: responseRateScore,
      urgency_bonus: urgencyBonus,
      total_score: totalScore,
    };
  }

  /**
   * Find best matching lawyer for a consultation
   * CODE-CONSULT-001:DOMAIN - Best match selection
   */
  async findBestMatch(
    category: ConsultCategory,
    urgency: ConsultUrgency
  ): Promise<MatchingScore | null> {
    // Get all lawyers
    const lawyers = this.db
      .prepare('SELECT id FROM lawyers WHERE is_verified = 1')
      .all() as Array<{ id: number }>;

    if (lawyers.length === 0) {
      return null;
    }

    // Calculate scores for all lawyers
    const scores = await Promise.all(
      lawyers.map((lawyer) =>
        this.calculateMatchingScore(lawyer.id, category, urgency)
      )
    );

    // Filter lawyers with minimum score and non-zero workload score
    const eligibleScores = scores.filter(
      (score) =>
        score.total_score >= SYSTEM_LIMITS.MIN_MATCHING_SCORE &&
        score.workload_score > 0
    );

    if (eligibleScores.length === 0) {
      return null;
    }

    // Sort by total score descending
    eligibleScores.sort((a, b) => b.total_score - a.total_score);

    // Return highest score
    return eligibleScores[0];
  }

  /**
   * Automatically match and assign consultation to best lawyer
   * CODE-CONSULT-001:DOMAIN - Auto-matching process
   */
  async autoMatch(consultId: number): Promise<void> {
    const consult = this.db
      .prepare(
        `
      SELECT category, urgency, status
      FROM consults
      WHERE id = ?
    `
      )
      .get(consultId) as {
      category: ConsultCategory;
      urgency: ConsultUrgency;
      status: string;
    } | null;

    if (!consult) {
      throw new Error('Consultation not found');
    }

    if (consult.status !== 'pending') {
      throw new Error('Consultation is not in pending status');
    }

    // Find best match
    const bestMatch = await this.findBestMatch(consult.category, consult.urgency);

    if (!bestMatch) {
      throw new Error('No suitable lawyer found');
    }

    // Assign lawyer
    this.db
      .prepare(
        `
      UPDATE consults
      SET lawyer_id = ?,
          status = 'assigned',
          matched_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
      )
      .run(bestMatch.lawyer_id, consultId);
  }
}
