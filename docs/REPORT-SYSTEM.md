# Report System Documentation

**@DOC:REPORT-001** | Chain: SPEC-REPORT-001 -> CODE-REPORT-001

## Overview

The Report System (교권 침해 신고 시스템) enables teachers to submit and track reports of infringements on teaching rights. This system follows the TDD approach and implements all requirements specified in SPEC-REPORT-001.

## System Architecture

### Components

1. **Database Layer** (`lib/db/`)
   - Reports table with foreign keys to users
   - Report status history tracking
   - Indexed for performance

2. **Service Layer** (`lib/services/`)
   - `ReportService`: CRUD operations with role-based access control
   - `ReportStateMachine`: State transition validation
   - `report-number-service`: Unique report number generation

3. **API Layer** (`app/api/reports/`)
   - `GET /api/reports`: List reports (role-filtered)
   - `POST /api/reports`: Create new report
   - `GET /api/reports/[id]`: Get report details
   - `PATCH /api/reports/[id]`: Update report
   - `PATCH /api/reports/[id]/status`: Update status (admin only)

4. **Type Definitions** (`lib/types/report.ts`)
   - TypeScript interfaces for type safety
   - Validation helpers

## Report Number Format

Reports are assigned unique identifiers in the format: `RPT-YYYYMMDD-XXXX`

Example: `RPT-20251017-0001`

- **RPT**: Fixed prefix
- **YYYYMMDD**: Date of creation
- **XXXX**: Sequential number (4 digits, zero-padded)

## Status Flow

```
received (접수완료)
   ↓
reviewing (검토중)
   ↓
consulting (상담진행)
   ↓
completed (해결완료)
```

### Valid Transitions

- `received` → `reviewing`, `completed`
- `reviewing` → `consulting`, `completed`
- `consulting` → `completed`
- `completed` → (none - final state)

### Invalid Transitions

- Backward transitions (e.g., `reviewing` → `received`)
- Skipping states (e.g., `received` → `consulting`)
- From completed state to any other state

## Role-Based Access Control

### Teacher (교사)
- **Create**: ✅ Can create reports
- **Read**: ✅ Can view own reports only
- **Update**: ✅ Can update own reports in `received` status only
- **Delete**: ❌ Cannot delete reports
- **Status Change**: ❌ Cannot change report status

### Admin (관리자)
- **Create**: ❌ Cannot create reports (only teachers)
- **Read**: ✅ Can view all reports
- **Update**: ✅ Can update any report (with restrictions)
- **Delete**: ❌ Cannot delete reports (preservation requirement)
- **Status Change**: ✅ Can change report status

### Lawyer (변호사)
- **Create**: ❌ Cannot create reports
- **Read**: ✅ Can view assigned reports only
- **Update**: ❌ Cannot update reports
- **Delete**: ❌ Cannot delete reports
- **Status Change**: ❌ Cannot change report status

## Validation Rules

### Title
- **Required**: Yes
- **Min Length**: 1 character
- **Max Length**: 100 characters

### Description
- **Required**: Yes
- **Min Length**: 1 character
- **Max Length**: 2000 characters

### Category
- **Required**: Yes
- **Valid Values**:
  - `학부모 민원` (Parent Complaint)
  - `학생 폭력` (Student Violence)
  - `명예훼손` (Defamation)

### Incident Date
- **Required**: Yes
- **Format**: ISO 8601 date string (YYYY-MM-DD)

### Location
- **Required**: Yes
- **Min Length**: 1 character
- **Max Length**: 200 characters

### Witness Count
- **Required**: No
- **Type**: Integer
- **Min Value**: 0

### Is Emergency
- **Required**: No
- **Type**: Boolean
- **Default**: false

## Business Rules

### Preservation Requirement
Reports CANNOT be deleted once created. This is a legal preservation requirement to maintain records of all infringement cases.

### Status Update Rules
1. Only admins can change report status
2. Status changes must follow valid transition paths
3. Each status change is recorded in history with:
   - Previous status
   - New status
   - Changed by (user ID)
   - Timestamp
   - Optional note

### Update Restrictions
1. Teachers can only update reports in `received` status
2. Completed reports cannot be updated by anyone
3. Only the report creator can update their own reports (teachers)
4. Admins can update reports but with status restrictions

## Performance Targets

As specified in SPEC-REPORT-001:

- **List API**: < 2000ms response time
- **Create API**: < 3000ms response time
- **Detail API**: < 250ms average response time
- **Concurrent Users**: Support 100 concurrent users
- **Monthly Volume**: Handle 1,000 reports per month

## Database Schema

### reports

```sql
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_number TEXT UNIQUE NOT NULL,
  teacher_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_date DATE NOT NULL,
  location TEXT NOT NULL,
  witness_count INTEGER,
  is_emergency BOOLEAN DEFAULT 0,
  status TEXT DEFAULT 'received',
  lawyer_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  FOREIGN KEY (lawyer_id) REFERENCES users(id)
);
```

### report_status_history

```sql
CREATE TABLE report_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by INTEGER NOT NULL,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  note TEXT,
  FOREIGN KEY (report_id) REFERENCES reports(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);
```

## API Reference

### List Reports

```http
GET /api/reports
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status
- `category` (optional): Filter by category

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "report_number": "RPT-20251017-0001",
      "teacher_id": 1,
      "category": "학부모 민원",
      "title": "Report Title",
      "status": "received",
      "created_at": "2025-10-17T10:00:00Z"
    }
  ],
  "count": 1
}
```

### Create Report

```http
POST /api/reports
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "학부모 민원",
  "title": "Report Title",
  "description": "Detailed description",
  "incident_date": "2025-10-17",
  "location": "School Name",
  "witness_count": 2,
  "is_emergency": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "report_number": "RPT-20251017-0001",
    "status": "received"
  },
  "message": "Report created successfully"
}
```

### Get Report Details

```http
GET /api/reports/1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "report_number": "RPT-20251017-0001",
    "teacher_id": 1,
    "category": "학부모 민원",
    "title": "Report Title",
    "description": "Detailed description",
    "status": "received",
    "statusHistory": [
      {
        "from_status": null,
        "to_status": "received",
        "changed_by": 1,
        "changed_at": "2025-10-17T10:00:00Z"
      }
    ]
  }
}
```

### Update Report

```http
PATCH /api/reports/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

### Update Report Status (Admin Only)

```http
PATCH /api/reports/1/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "reviewing",
  "note": "Starting review process"
}
```

## Testing

The report system has comprehensive test coverage (40 tests, 100% passing):

### Test Suites

1. **Report Number Generation** (`tests/reports/report-number.test.ts`)
   - Format validation (RPT-YYYYMMDD-XXXX)
   - Sequential numbering
   - Date inclusion
   - Error handling

2. **State Transitions** (`tests/reports/state-transition.test.ts`)
   - Valid transitions
   - Invalid transitions
   - Initial state validation
   - Final state validation

3. **CRUD Operations** (`tests/reports/report-crud.test.ts`)
   - Create with validation
   - Read with access control
   - Update with restrictions
   - Delete prevention
   - Status management

### Running Tests

```bash
npm test -- tests/reports
```

## Error Handling

### Custom Error Classes

- `ReportValidationError`: Validation failures
- `ReportNotFoundError`: Report not found
- `ReportAccessDeniedError`: Access control violations
- `InvalidStatusTransitionError`: Invalid state transitions
- `ReportCompletedError`: Attempts to modify completed reports
- `ReportDeleteForbiddenError`: Attempts to delete reports

### HTTP Status Codes

- `200 OK`: Successful GET/PATCH
- `201 Created`: Successful POST
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Access denied or business rule violation
- `404 Not Found`: Report not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Unexpected server error

## Future Enhancements

- File attachment support (SPEC-FILE-001)
- Email notifications (SPEC-NOTIFY-001)
- Lawyer assignment workflow
- Report analytics and statistics
- Search and filtering capabilities
- Export functionality (PDF, Excel)

## Related Specifications

- **@SPEC:REPORT-001**: Report System Requirements
- **@SPEC:AUTH-001**: Authentication System
- **@SPEC:FILE-001**: File Attachment System (planned)
- **@SPEC:NOTIFY-001**: Notification System (planned)

## Maintenance

### Database Migrations

Report tables are automatically created via `lib/db/database.ts` initialization. The migration includes:

- Table creation with foreign keys
- Index creation for performance
- Constraint enforcement

### Monitoring

Monitor these metrics:
- Report creation rate
- Status transition distribution
- API response times
- Error rates
- User access patterns

## Support

For issues or questions related to the report system, contact the development team or refer to the SPEC-REPORT-001 specification document.

---

**Last Updated**: 2025-10-19
**Version**: 1.0.0
**TAG Chain**: @SPEC:REPORT-001 -> @CODE:REPORT-001 -> @TEST:REPORT-001 -> @DOC:REPORT-001
