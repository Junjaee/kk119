# Authentication Flow Test Documentation

## Overview

This document describes the authentication flow test designed to verify if the 2-second delay mechanism in `auth-sync.ts` is working properly to prevent role persistence issues.

## The Problem

Users were experiencing a bug where after logging out and logging in with a different user role, they would see menu items from the previous user's role. This indicates that the authentication state wasn't being properly cleared and refreshed between user sessions.

## The Solution

A 2-second delay mechanism was implemented in `lib/auth/auth-sync.ts` in the `refreshAuthState()` method:

```typescript
// Add additional delay after login completion to prevent immediate refresh
if (this.loginCompletedAt && Date.now() - this.loginCompletedAt < 2000) {
  console.log('🔄 [AUTH-SYNC] Skipping refresh - login recently completed');
  return;
}
```

This prevents the refresh mechanism from running immediately after login, allowing the new user state to properly settle.

## Test Setup

### Files Created

1. **`simple-auth-test.js`** - Main browser automation test script
2. **`check-servers.js`** - Utility to check for running development servers
3. **`run-test.bat`** - Windows batch file to run the test
4. **`screenshots/`** - Directory for test screenshots

### Test Credentials

- **Teacher Account**: `teacher@kk119.com` / `Teacher2025!`
- **Association Admin**: `association@kk119.com` / `Assoc2025!`

## Test Process

### Step 1: Environment Check
- Scans ports 3000-3003, 3009 for running Next.js development server
- Requires server to be running before test execution

### Step 2: Teacher Login Test
1. Navigate to login page
2. Clear all storage (localStorage, sessionStorage, cookies)
3. Login with teacher credentials
4. Monitor console for auth-sync logs
5. Capture screenshot of teacher dashboard
6. Record teacher-specific menu items

### Step 3: Logout and State Clearing
1. Attempt to find and click logout button
2. Fallback to manual storage clearing if no logout button found
3. Allow time for state clearing to complete

### Step 4: Association Admin Login Test
1. Navigate back to login page
2. Login with association admin credentials
3. Monitor auth-sync behavior during role switch
4. Capture screenshot of admin dashboard
5. Record admin-specific menu items

### Step 5: Bug Detection
1. Search for any remaining teacher-specific menu items
2. Compare navigation content before and after role switch
3. Report if role persistence bug is detected

## Console Log Monitoring

The test specifically monitors for these auth-sync log patterns:

```
🔐 [timestamp] 🔄 [AUTH-SYNC] Syncing user state: {...}
🔐 [timestamp] 🔒 [AUTH-SYNC] Starting login process
🔐 [timestamp] 🔓 [AUTH-SYNC] Login process completed
🔐 [timestamp] 🔄 [AUTH-SYNC] Skipping refresh - login recently completed
🔐 [timestamp] 🔄 [AUTH-SYNC] Refreshing auth state from server
```

## Expected Behavior

### If 2-Second Delay is Working Correctly:
1. Teacher login completes successfully
2. Teacher menu items appear (수업, 학생, 성적)
3. Logout clears all state
4. Association admin login completes successfully
5. Only admin menu items appear (회원, 협회, 관리)
6. **No teacher menu items remain visible**

### If Bug Still Exists:
1. After association admin login, teacher menu items are still visible
2. Console shows immediate refresh calls without delay
3. Role switching doesn't properly clear previous user state

## Screenshot Documentation

The test captures screenshots at key points:

1. **`01-login-page.png`** - Initial login page
2. **`02-teacher-dashboard.png`** - Teacher dashboard after login
3. **`03-association-admin-dashboard.png`** - Admin dashboard after role switch
4. **`04-final-state.png`** - Final state for manual verification

## How to Run the Test

### Prerequisites
1. Ensure Next.js development server is running:
   ```bash
   npm run dev
   # or
   npm run dev -- -p 3009
   ```

2. Check if Playwright is installed:
   ```bash
   npm run test:e2e:setup
   ```

### Running the Test

1. **Check for running servers**:
   ```bash
   node check-servers.js
   ```

2. **Run the authentication test**:
   ```bash
   node simple-auth-test.js
   ```

3. **Or use the batch file** (Windows):
   ```bash
   run-test.bat
   ```

### Test Output Interpretation

#### Success Output:
```
✅ No teacher menu items found after role switch
✅ The 2-second delay mechanism appears to be working correctly
🏁 TEST COMPLETED
✅ SUCCESS: No role persistence issues detected
```

#### Failure Output:
```
🚨 BUG DETECTED: Teacher menu items still visible after association admin login!
   1. <a> "수업 관리"
   2. <span> "학생 성적"
❌ The 2-second delay mechanism is NOT working properly
🏁 TEST COMPLETED
❌ ISSUE FOUND: Role persistence bug still exists
```

## Debug Information

### Key Auth-Sync Methods Involved

1. **`startLogin()`** - Sets login flag and prevents concurrent refreshes
2. **`endLogin()`** - Marks login completion timestamp
3. **`refreshAuthState()`** - Checks 2-second delay before refreshing
4. **`clearAllAuthState()`** - Comprehensive state clearing

### Manual Verification

After the test completes:

1. **Check browser console** for auth-sync logs
2. **Inspect browser dev tools** for remaining auth tokens
3. **Manually navigate** through the application to verify role-based menus
4. **Review screenshots** for visual confirmation

## Troubleshooting

### Common Issues

1. **Server not running**: Ensure development server is started first
2. **Playwright not installed**: Run `npm run test:e2e:setup`
3. **Permission issues**: Run as administrator if needed
4. **Port conflicts**: Check if different ports are being used

### Debug Mode

For more detailed debugging, modify the test to:
- Increase wait times
- Add more console logging
- Keep browser open longer for manual inspection
- Enable Playwright debug mode

## Expected Test Duration

- **Total test time**: ~45 seconds
- **Browser open time**: Additional 20 seconds for manual inspection
- **Screenshot capture**: 4 screenshots saved to `screenshots/` folder

## Next Steps

Based on test results:

### If Test Passes:
- ✅ The 2-second delay mechanism is working
- ✅ Role persistence bug is resolved
- Document the fix and close related issues

### If Test Fails:
- 🔍 Investigate auth-sync timing
- 🔧 Adjust delay duration or mechanism
- 🧪 Add additional state clearing steps
- 🔄 Re-test after modifications