const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testAuthFlow(serverUrl) {
  console.log('🚀 Starting authentication flow test...');

  // Create screenshots directory
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  const browser = await chromium.launch({
    headless: false,
    devtools: true,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Capture console logs with timestamps and filtering for auth-sync
  page.on('console', msg => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const text = msg.text();

    // Highlight auth-sync logs
    if (text.includes('[AUTH-SYNC]')) {
      console.log(`🔐 [${timestamp}] ${text}`);
    } else if (text.includes('auth') || text.includes('Auth') || text.includes('login') || text.includes('user')) {
      console.log(`🔍 [${timestamp}] ${text}`);
    } else {
      console.log(`💬 [${timestamp}] ${text}`);
    }
  });

  page.on('pageerror', error => {
    console.error(`❌ PAGE ERROR: ${error.message}`);
  });

  try {
    console.log('\n=== STEP 1: Navigate to Login Page ===');
    await page.goto(`${serverUrl}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });
    console.log('📸 Screenshot: 01-login-page.png');

    console.log('\n=== STEP 2: Clear Storage and State ===');
    await page.evaluate(() => {
      console.log('🧹 [AUTH-SYNC] Clearing all storage manually...');
      localStorage.clear();
      sessionStorage.clear();
      // Clear cookies
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    });

    console.log('\n=== STEP 3: Teacher Login Test ===');

    // Wait for form elements
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });

    // Clear and fill email
    await page.fill('input[type="email"]', '');
    await page.fill('input[type="email"]', 'teacher@kk119.com');

    // Clear and fill password
    await page.fill('input[type="password"]', '');
    await page.fill('input[type="password"]', 'Teacher2025!');

    console.log('🔑 Filled teacher credentials');

    // Click login button
    await page.click('button[type="submit"]');
    console.log('👆 Clicked login button for teacher');

    // Watch for auth-sync logs during login process
    console.log('⏱️  Monitoring auth-sync behavior for next 10 seconds...');
    await page.waitForTimeout(10000); // Extended wait to observe the 2-second delay

    const teacherUrl = page.url();
    console.log(`📍 Current URL: ${teacherUrl}`);

    // Take screenshot of teacher dashboard
    await page.screenshot({ path: 'screenshots/02-teacher-dashboard.png', fullPage: true });
    console.log('📸 Screenshot: 02-teacher-dashboard.png');

    // Extract sidebar/navigation content
    const navigationContent = await page.evaluate(() => {
      const navElements = document.querySelectorAll('nav, [role="navigation"], .sidebar, .navigation');
      return Array.from(navElements).map(el => el.textContent?.trim()).join(' | ');
    });
    console.log('📋 Teacher navigation content:', navigationContent.substring(0, 200) + '...');

    // Look for teacher-specific menu items
    const teacherMenuItems = await page.$$eval('*', elements =>
      Array.from(elements)
        .filter(el => el.textContent && (
          el.textContent.includes('수업') ||
          el.textContent.includes('학생') ||
          el.textContent.includes('성적') ||
          el.textContent.includes('Teacher')
        ))
        .map(el => el.textContent.trim())
        .filter((text, index, array) => array.indexOf(text) === index) // Remove duplicates
        .slice(0, 5)
    );
    console.log('👨‍🏫 Teacher menu items:', teacherMenuItems);

    console.log('\n=== STEP 4: Logout ===');

    // Attempt logout through various methods
    const logoutSuccess = await page.evaluate(() => {
      // Look for logout buttons/links
      const logoutElements = Array.from(document.querySelectorAll('*')).filter(el =>
        el.textContent && (
          el.textContent.includes('로그아웃') ||
          el.textContent.includes('Logout') ||
          el.textContent.includes('Sign out')
        )
      );

      if (logoutElements.length > 0) {
        console.log('🚪 [AUTH-SYNC] Found logout element, clicking...');
        logoutElements[0].click();
        return true;
      }

      // Manual state clearing
      console.log('🧹 [AUTH-SYNC] Manual logout - clearing all storage...');
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      return false;
    });

    if (logoutSuccess) {
      console.log('✅ Logout button clicked');
    } else {
      console.log('⚠️  Manual logout performed');
    }

    // Wait for logout to process
    await page.waitForTimeout(3000);

    // Navigate back to login
    await page.goto(`${serverUrl}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== STEP 5: Association Admin Login Test ===');

    // Clear and fill association admin credentials
    await page.fill('input[type="email"]', '');
    await page.fill('input[type="email"]', 'association@kk119.com');

    await page.fill('input[type="password"]', '');
    await page.fill('input[type="password"]', 'Assoc2025!');

    console.log('🔑 Filled association admin credentials');

    // Click login button
    await page.click('button[type="submit"]');
    console.log('👆 Clicked login button for association admin');

    // Extended monitoring for auth-sync behavior
    console.log('⏱️  Monitoring auth-sync behavior during role switch...');
    await page.waitForTimeout(10000); // Watch for the 2-second delay and role switching

    const adminUrl = page.url();
    console.log(`📍 Current URL: ${adminUrl}`);

    // Take screenshot of association admin dashboard
    await page.screenshot({ path: 'screenshots/03-association-admin-dashboard.png', fullPage: true });
    console.log('📸 Screenshot: 03-association-admin-dashboard.png');

    // Extract navigation content after role switch
    const adminNavigationContent = await page.evaluate(() => {
      const navElements = document.querySelectorAll('nav, [role="navigation"], .sidebar, .navigation');
      return Array.from(navElements).map(el => el.textContent?.trim()).join(' | ');
    });
    console.log('📋 Admin navigation content:', adminNavigationContent.substring(0, 200) + '...');

    // Look for association admin menu items
    const adminMenuItems = await page.$$eval('*', elements =>
      Array.from(elements)
        .filter(el => el.textContent && (
          el.textContent.includes('회원') ||
          el.textContent.includes('협회') ||
          el.textContent.includes('관리') ||
          el.textContent.includes('Association') ||
          el.textContent.includes('사용자')
        ))
        .map(el => el.textContent.trim())
        .filter((text, index, array) => array.indexOf(text) === index) // Remove duplicates
        .slice(0, 5)
    );
    console.log('👔 Association admin menu items:', adminMenuItems);

    console.log('\n=== STEP 6: Role Persistence Bug Check ===');

    // Critical test: Look for any remaining teacher-specific elements
    const teacherElementsAfterSwitch = await page.$$eval('*', elements =>
      Array.from(elements)
        .filter(el => el.textContent && (
          el.textContent.includes('수업') ||
          el.textContent.includes('학생') ||
          el.textContent.includes('성적')
        ))
        .map(el => ({
          tag: el.tagName.toLowerCase(),
          text: el.textContent.trim().substring(0, 50),
          class: el.className
        }))
    );

    if (teacherElementsAfterSwitch.length > 0) {
      console.log('🚨 BUG DETECTED: Teacher menu items still visible after association admin login!');
      teacherElementsAfterSwitch.forEach((el, i) => {
        console.log(`   ${i + 1}. <${el.tag}> "${el.text}"`);
      });
      console.log('❌ The 2-second delay mechanism is NOT working properly');
    } else {
      console.log('✅ No teacher menu items found after role switch');
      console.log('✅ The 2-second delay mechanism appears to be working correctly');
    }

    // Final state screenshot and pause for manual inspection
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/04-final-state.png', fullPage: true });
    console.log('📸 Screenshot: 04-final-state.png');

    console.log('\n=== TEST RESULTS SUMMARY ===');
    console.log(`📍 Teacher login URL: ${teacherUrl}`);
    console.log(`📍 Admin login URL: ${adminUrl}`);
    console.log(`👨‍🏫 Teacher menu items found: ${teacherMenuItems.length}`);
    console.log(`👔 Admin menu items found: ${adminMenuItems.length}`);
    console.log(`🚨 Role persistence bug detected: ${teacherElementsAfterSwitch.length > 0 ? 'YES' : 'NO'}`);
    console.log(`📁 Screenshots saved in: screenshots/`);

    return {
      bugDetected: teacherElementsAfterSwitch.length > 0,
      teacherElements: teacherMenuItems,
      adminElements: adminMenuItems,
      conflictingElements: teacherElementsAfterSwitch
    };

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
    throw error;
  } finally {
    console.log('\n⏸️  Browser will remain open for 20 seconds for manual inspection...');
    console.log('   Check the browser console for auth-sync logs');
    console.log('   Press Ctrl+C to close immediately');

    await page.waitForTimeout(20000);
    await browser.close();
  }
}

// Check if server is accessible on common ports
async function findRunningServer() {
  const http = require('http');
  const ports = [3009, 3000, 3001, 3002, 3003];

  for (const port of ports) {
    const isRunning = await new Promise((resolve) => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        resolve(true);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.setTimeout(3000, () => {
        resolve(false);
      });
    });

    if (isRunning) {
      console.log(`✅ Found server running on http://localhost:${port}`);
      return `http://localhost:${port}`;
    }
  }

  console.error('❌ No development server found on common ports (3000-3003, 3009)');
  console.log('Please start the development server with one of:');
  console.log('npm run dev');
  console.log('npm run dev -- -p 3009');
  return null;
}

// Main execution
async function main() {
  console.log('🔍 Authentication Flow Test - 2-Second Delay Mechanism Verification');
  console.log('════════════════════════════════════════════════════════════════════\n');

  const serverUrl = await findRunningServer();
  if (!serverUrl) {
    process.exit(1);
  }

  try {
    const results = await testAuthFlow(serverUrl);

    console.log('\n════════════════════════════════════════════════════════════════════');
    console.log('🏁 TEST COMPLETED');

    if (results.bugDetected) {
      console.log('❌ ISSUE FOUND: Role persistence bug still exists');
      console.log('   The 2-second delay mechanism needs further investigation');
    } else {
      console.log('✅ SUCCESS: No role persistence issues detected');
      console.log('   The 2-second delay mechanism is working correctly');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

main();