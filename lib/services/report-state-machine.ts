// @CODE:REPORT-STATE-001 | Chain: SPEC-REPORT-001 -> CODE-REPORT-001 -> TEST-REPORT-STATE-001
// Report state machine service

import { ReportStatus } from '@/lib/types/report';

/**
 * State machine for managing report status transitions
 * @CODE:REPORT-STATE-001-MACHINE
 */
export class ReportStateMachine {
  private readonly stateTransitions: Map<ReportStatus, ReportStatus[]>;

  constructor() {
    // Define valid state transitions
    this.stateTransitions = new Map([
      ['received', ['reviewing', 'completed']],
      ['reviewing', ['consulting', 'completed']],
      ['consulting', ['completed']],
      ['completed', []], // Terminal state - no transitions allowed
    ]);
  }

  /**
   * Check if transition from one state to another is valid
   * @CODE:REPORT-STATE-001-CAN-TRANSITION
   */
  canTransition(fromStatus: ReportStatus, toStatus: ReportStatus): boolean {
    this.validateStatus(fromStatus);
    this.validateStatus(toStatus);

    const allowedTransitions = this.stateTransitions.get(fromStatus);
    if (!allowedTransitions) {
      return false;
    }

    return allowedTransitions.includes(toStatus);
  }

  /**
   * Validate if status is a valid report status
   * @CODE:REPORT-STATE-001-VALIDATE
   */
  private validateStatus(status: ReportStatus): void {
    if (!status) {
      throw new Error('Status cannot be undefined or null');
    }

    const validStatuses: ReportStatus[] = ['received', 'reviewing', 'consulting', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
  }

  /**
   * Check if status is a valid initial state
   * @CODE:REPORT-STATE-001-INITIAL
   */
  isValidInitialState(status: ReportStatus): boolean {
    return status === 'received';
  }

  /**
   * Check if status is a final state
   * @CODE:REPORT-STATE-001-FINAL
   */
  isFinalState(status: ReportStatus): boolean {
    return status === 'completed';
  }

  /**
   * Get list of valid next states from current state
   * @CODE:REPORT-STATE-001-NEXT-STATES
   */
  getNextValidStates(currentStatus: ReportStatus): ReportStatus[] {
    this.validateStatus(currentStatus);
    return this.stateTransitions.get(currentStatus) || [];
  }
}
