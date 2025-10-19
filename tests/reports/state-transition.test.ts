// @TEST:REPORT-STATE-001 | Chain: SPEC-REPORT-001 -> CODE-REPORT-001
// TEST-REPORT-STATE-001: Report state transition tests
import { describe, it, expect } from 'vitest';
import { ReportStateMachine } from '@/lib/services/report-state-machine';
import { ReportStatus } from '@/lib/types';

describe('Report State Transitions', () => {
  let stateMachine: ReportStateMachine;

  beforeEach(() => {
    stateMachine = new ReportStateMachine();
  });

  describe('TEST-REPORT-STATE-001-HAPPY: Valid Transitions', () => {
    it('should transition from received to reviewing', () => {
      const canTransition = stateMachine.canTransition('received', 'reviewing');
      expect(canTransition).toBe(true);
    });

    it('should transition from reviewing to consulting', () => {
      const canTransition = stateMachine.canTransition('reviewing', 'consulting');
      expect(canTransition).toBe(true);
    });

    it('should transition from consulting to completed', () => {
      const canTransition = stateMachine.canTransition('consulting', 'completed');
      expect(canTransition).toBe(true);
    });

    it('should allow direct completion from any state', () => {
      const states: ReportStatus[] = ['received', 'reviewing', 'consulting'];

      states.forEach(state => {
        const canTransition = stateMachine.canTransition(state, 'completed');
        expect(canTransition).toBe(true);
      });
    });
  });

  describe('TEST-REPORT-STATE-001-EDGE: Invalid Transitions', () => {
    it('should not allow backward transition from reviewing to received', () => {
      const canTransition = stateMachine.canTransition('reviewing', 'received');
      expect(canTransition).toBe(false);
    });

    it('should not allow skipping reviewing stage', () => {
      const canTransition = stateMachine.canTransition('received', 'consulting');
      expect(canTransition).toBe(false);
    });

    it('should not allow transition from completed to any state', () => {
      const targets: ReportStatus[] = ['received', 'reviewing', 'consulting'];

      targets.forEach(target => {
        const canTransition = stateMachine.canTransition('completed', target);
        expect(canTransition).toBe(false);
      });
    });
  });

  describe('TEST-REPORT-STATE-001-ERROR: Error Cases', () => {
    it('should throw error for invalid from state', () => {
      expect(() =>
        stateMachine.canTransition('invalid' as any, 'reviewing')
      ).toThrow();
    });

    it('should throw error for invalid to state', () => {
      expect(() =>
        stateMachine.canTransition('received', 'invalid' as any)
      ).toThrow();
    });

    it('should throw error for undefined states', () => {
      expect(() =>
        stateMachine.canTransition(undefined as any, undefined as any)
      ).toThrow();
    });
  });

  describe('TEST-REPORT-STATE-001-VALIDATION: State Validation', () => {
    it('should validate received as valid initial state', () => {
      const isValid = stateMachine.isValidInitialState('received');
      expect(isValid).toBe(true);
    });

    it('should reject non-received as initial state', () => {
      const states: ReportStatus[] = ['reviewing', 'consulting', 'completed'];

      states.forEach(state => {
        const isValid = stateMachine.isValidInitialState(state);
        expect(isValid).toBe(false);
      });
    });

    it('should identify completed as final state', () => {
      const isFinal = stateMachine.isFinalState('completed');
      expect(isFinal).toBe(true);
    });

    it('should get next valid states', () => {
      const nextStates = stateMachine.getNextValidStates('received');
      expect(nextStates).toContain('reviewing');
      expect(nextStates).toContain('completed');
    });
  });
});
