const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testAuthFlow() {
  console.log('🚀 Starting authentication flow test...');

  const browser = await chromium.launch({
    headless: false, // Keep browser visible for observation
    devtools: true   // Open dev tools to see console logs
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging to capture auth-sync logs
  page.on('console', msg => {
    console.log(`🖥️  BROWSER: ${msg.text()}`);
  });

  // Enable error logging
  page.on('pageerror', error => {
    console.error(`❌ PAGE ERROR: ${error.message}`);
  });

  try {
    console.log('\n=== STEP 1: Navigate to Login Page ===');
    await page.goto('http://localhost:3009/login');
    await page.waitForTimeout(2000); // Wait for page to load

    // Take screenshot of login page
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    console.log('📸 Screenshot saved: login-page.png');

    console.log('\n=== STEP 2: Test Teacher Login ===');

    // Clear any existing state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Fill in teacher credentials
    await page.fill('input[type="email"]', 'teacher@kk119.com');
    await page.fill('input[type="password"]', 'Teacher2025!');

    console.log('🔑 Filled teacher credentials');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation and auth state to settle
    console.log('⏱️  Waiting for authentication to complete...');
    await page.waitForTimeout(5000); // Give extra time for auth sync

    // Check if we're redirected (should go to dashboard)
    const currentUrl = page.url();
    console.log(`📍 Current URL after teacher login: ${currentUrl}`);

    // Take screenshot after teacher login
    await page.screenshot({ path: 'teacher-login-result.png', fullPage: true });
    console.log('📸 Screenshot saved: teacher-login-result.png');

    // Check sidebar content for teacher
    const sidebarContent = await page.textContent('[role="navigation"], .sidebar, nav');
    console.log('📋 Teacher sidebar content:', sidebarContent?.substring(0, 200) + '...');

    // Look for teacher-specific menu items
    const teacherMenuItems = await page.$$eval('a, button', elements =>
      elements.filter(el => el.textContent?.includes('수업') || el.textContent?.includes('학생') || el.textContent?.includes('성적'))
        .map(el => el.textContent?.trim())
    );
    console.log('👨‍🏫 Teacher menu items found:', teacherMenuItems);

    console.log('\n=== STEP 3: Logout ===');

    // Try to find and click logout button
    try {
      await page.click('button:has-text("로그아웃"), button:has-text("Logout"), [data-testid="logout"]');
      console.log('🚪 Clicked logout button');
    } catch (e) {
      console.log('⚠️  Could not find logout button, clearing storage manually');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
        // Clear cookies
        document.cookie.split(";").forEach(c => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      });
    }

    // Wait for logout to complete
    await page.waitForTimeout(3000);

    // Navigate back to login
    await page.goto('http://localhost:3009/login');
    await page.waitForTimeout(2000);

    console.log('\n=== STEP 4: Test Association Admin Login ===');

    // Fill in association admin credentials
    await page.fill('input[type="email"]', 'association@kk119.com');
    await page.fill('input[type="password"]', 'Assoc2025!');

    console.log('🔑 Filled association admin credentials');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation and auth state to settle
    console.log('⏱️  Waiting for authentication to complete...');
    await page.waitForTimeout(5000); // Give extra time for auth sync

    // Check if we're redirected
    const currentUrl2 = page.url();
    console.log(`📍 Current URL after association admin login: ${currentUrl2}`);

    // Take screenshot after association admin login
    await page.screenshot({ path: 'association-admin-login-result.png', fullPage: true });
    console.log('📸 Screenshot saved: association-admin-login-result.png');

    // Check sidebar content for association admin
    const sidebarContent2 = await page.textContent('[role="navigation"], .sidebar, nav');
    console.log('📋 Association admin sidebar content:', sidebarContent2?.substring(0, 200) + '...');

    // Look for association admin-specific menu items
    const adminMenuItems = await page.$$eval('a, button', elements =>
      elements.filter(el => el.textContent?.includes('회원') || el.textContent?.includes('협회') || el.textContent?.includes('관리'))
        .map(el => el.textContent?.trim())
    );
    console.log('👔 Association admin menu items found:', adminMenuItems);

    console.log('\n=== STEP 5: Test Role Persistence Issue ===');

    // Check if any teacher menu items are still visible (this would be the bug)
    const remainingTeacherItems = await page.$$eval('a, button', elements =>
      elements.filter(el => el.textContent?.includes('수업') || el.textContent?.includes('학생') || el.textContent?.includes('성적'))
        .map(el => el.textContent?.trim())
    );

    if (remainingTeacherItems.length > 0) {
      console.log('🚨 BUG DETECTED: Teacher menu items still visible after association admin login:', remainingTeacherItems);
    } else {
      console.log('✅ No teacher menu items found - role switching appears to work correctly');
    }

    // Wait a bit more and take final screenshot
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'final-state.png', fullPage: true });
    console.log('📸 Final screenshot saved: final-state.png');

    console.log('\n=== Test Summary ===');
    console.log('✅ Test completed successfully');
    console.log('📁 Screenshots saved in current directory:');
    console.log('  - login-page.png');
    console.log('  - teacher-login-result.png');
    console.log('  - association-admin-login-result.png');
    console.log('  - final-state.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'error-state.png', fullPage: true });
    console.log('📸 Error screenshot saved: error-state.png');
  } finally {
    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will remain open for manual inspection...');
    console.log('   Press Ctrl+C to close the browser and exit');

    // Wait indefinitely until user manually closes
    await new Promise(() => {});
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3009');
    if (response.ok) {
      console.log('✅ Server is running on http://localhost:3009');
      return true;
    }
  } catch (error) {
    console.error('❌ Server is not running on http://localhost:3009');
    console.log('Please start the development server with: npm run dev');
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testAuthFlow();
  }
})();