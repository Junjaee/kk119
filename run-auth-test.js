const { spawn, exec } = require('child_process');
const { chromium } = require('playwright');
const http = require('http');

let serverProcess = null;

async function checkServer(port = 3009) {
  return new Promise((resolve) => {
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
}

async function startServer() {
  console.log('🚀 Starting development server...');

  // Check if server is already running
  const isRunning = await checkServer(3009);
  if (isRunning) {
    console.log('✅ Server is already running on port 3009');
    return true;
  }

  // Check if any other port is being used by next
  for (let port = 3000; port <= 3010; port++) {
    const running = await checkServer(port);
    if (running) {
      console.log(`✅ Found server running on port ${port}`);
      // Update our test URL
      global.TEST_URL = `http://localhost:${port}`;
      return true;
    }
  }

  // Start the server
  return new Promise((resolve) => {
    serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      shell: true
    });

    let serverReady = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📟 Server:', output.trim());

      // Check if server is ready
      if (output.includes('Ready') || output.includes('started server')) {
        if (!serverReady) {
          serverReady = true;
          console.log('✅ Development server is ready!');
          global.TEST_URL = 'http://localhost:3000'; // Default Next.js port
          setTimeout(() => resolve(true), 2000); // Give it a moment to fully start
        }
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('❌ Server Error:', data.toString());
    });

    serverProcess.on('close', (code) => {
      console.log(`🛑 Server process exited with code ${code}`);
      if (!serverReady) {
        resolve(false);
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverReady) {
        console.error('❌ Server startup timeout');
        resolve(false);
      }
    }, 30000);
  });
}

async function testAuthFlow() {
  const testUrl = global.TEST_URL || 'http://localhost:3000';
  console.log(`🔍 Testing authentication flow on ${testUrl}`);

  const browser = await chromium.launch({
    headless: false,
    devtools: true,
    slowMo: 500 // Slow down actions for better observation
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Capture console logs with timestamps
  page.on('console', msg => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`🖥️  [${timestamp}] BROWSER: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.error(`❌ PAGE ERROR: ${error.message}`);
  });

  try {
    console.log('\n=== STEP 1: Navigate to Login Page ===');
    await page.goto(`${testUrl}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });
    console.log('📸 Screenshot: 01-login-page.png');

    console.log('\n=== STEP 2: Clear Any Existing State ===');
    await page.evaluate(() => {
      console.log('🧹 Clearing all storage...');
      localStorage.clear();
      sessionStorage.clear();
      // Clear cookies
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    });

    console.log('\n=== STEP 3: Test Teacher Login ===');

    // Wait for form to be ready
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.fill('input[type="email"]', 'teacher@kk119.com');
    await page.fill('input[type="password"]', 'Teacher2025!');
    console.log('🔑 Filled teacher credentials');

    // Click login and wait for response
    await page.click('button[type="submit"]');
    console.log('👆 Clicked login button for teacher');

    // Wait for navigation or error
    try {
      await page.waitForFunction(() =>
        window.location.pathname !== '/login' ||
        document.querySelector('.error-message') !== null,
        { timeout: 15000 }
      );
    } catch (e) {
      console.log('⚠️  Navigation timeout, checking current state...');
    }

    await page.waitForTimeout(3000); // Allow auth-sync delay to complete

    const teacherUrl = page.url();
    console.log(`📍 URL after teacher login: ${teacherUrl}`);

    await page.screenshot({ path: 'screenshots/02-teacher-dashboard.png', fullPage: true });
    console.log('📸 Screenshot: 02-teacher-dashboard.png');

    // Check for teacher-specific elements
    const teacherElements = await page.$$eval('*', elements =>
      elements
        .filter(el => el.textContent && (
          el.textContent.includes('수업') ||
          el.textContent.includes('학생') ||
          el.textContent.includes('성적') ||
          el.textContent.includes('Teacher') ||
          el.textContent.includes('교사')
        ))
        .map(el => ({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 50),
          className: el.className
        }))
        .slice(0, 10) // Limit results
    );
    console.log('👨‍🏫 Teacher-specific elements:', teacherElements);

    console.log('\n=== STEP 4: Logout from Teacher Account ===');

    // Try multiple logout strategies
    const logoutSelectors = [
      'button:has-text("로그아웃")',
      'button:has-text("Logout")',
      '[data-testid="logout"]',
      'a[href*="logout"]',
      'button:has-text("Sign out")',
      'button[aria-label*="logout"]'
    ];

    let loggedOut = false;
    for (const selector of logoutSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          console.log(`🚪 Clicked logout using selector: ${selector}`);
          loggedOut = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!loggedOut) {
      console.log('⚠️  No logout button found, clearing state manually');
      await page.evaluate(() => {
        console.log('🧹 Manual logout - clearing all storage...');
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach(c => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      });
    }

    // Wait for logout to complete
    await page.waitForTimeout(2000);

    // Navigate back to login
    await page.goto(`${testUrl}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('\n=== STEP 5: Test Association Admin Login ===');

    await page.fill('input[type="email"]', 'association@kk119.com');
    await page.fill('input[type="password"]', 'Assoc2025!');
    console.log('🔑 Filled association admin credentials');

    await page.click('button[type="submit"]');
    console.log('👆 Clicked login button for association admin');

    // Wait for navigation
    try {
      await page.waitForFunction(() =>
        window.location.pathname !== '/login' ||
        document.querySelector('.error-message') !== null,
        { timeout: 15000 }
      );
    } catch (e) {
      console.log('⚠️  Navigation timeout, checking current state...');
    }

    await page.waitForTimeout(3000); // Allow auth-sync delay to complete

    const adminUrl = page.url();
    console.log(`📍 URL after association admin login: ${adminUrl}`);

    await page.screenshot({ path: 'screenshots/03-association-admin-dashboard.png', fullPage: true });
    console.log('📸 Screenshot: 03-association-admin-dashboard.png');

    // Check for association admin-specific elements
    const adminElements = await page.$$eval('*', elements =>
      elements
        .filter(el => el.textContent && (
          el.textContent.includes('회원') ||
          el.textContent.includes('협회') ||
          el.textContent.includes('관리') ||
          el.textContent.includes('Association') ||
          el.textContent.includes('Admin')
        ))
        .map(el => ({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 50),
          className: el.className
        }))
        .slice(0, 10) // Limit results
    );
    console.log('👔 Association admin-specific elements:', adminElements);

    console.log('\n=== STEP 6: Check for Role Persistence Bug ===');

    // Look for any remaining teacher elements (this would indicate the bug)
    const remainingTeacherElements = await page.$$eval('*', elements =>
      elements
        .filter(el => el.textContent && (
          el.textContent.includes('수업') ||
          el.textContent.includes('학생') ||
          el.textContent.includes('성적')
        ))
        .map(el => ({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 50),
          className: el.className
        }))
    );

    if (remainingTeacherElements.length > 0) {
      console.log('🚨 POTENTIAL BUG: Teacher elements still visible after association admin login:');
      remainingTeacherElements.forEach(el => console.log(`   - ${el.tag}: "${el.text}"`));
    } else {
      console.log('✅ No teacher elements found - role switching appears to work correctly');
    }

    // Final state screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/04-final-state.png', fullPage: true });
    console.log('📸 Screenshot: 04-final-state.png');

    console.log('\n=== TEST SUMMARY ===');
    console.log('✅ Authentication flow test completed');
    console.log('📁 Screenshots saved in screenshots/ directory');
    console.log('📝 Check console logs above for auth-sync behavior');

    return {
      teacherUrl,
      adminUrl,
      bugDetected: remainingTeacherElements.length > 0,
      teacherElements: teacherElements.length,
      adminElements: adminElements.length,
      remainingTeacherElements: remainingTeacherElements.length
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'screenshots/error-state.png', fullPage: true });
    throw error;
  } finally {
    console.log('\n⏸️  Browser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

async function cleanup() {
  if (serverProcess) {
    console.log('🛑 Stopping development server...');
    serverProcess.kill();
  }
}

// Main execution
async function main() {
  try {
    // Create screenshots directory
    const fs = require('fs');
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots');
    }

    const serverStarted = await startServer();
    if (!serverStarted) {
      console.error('❌ Failed to start server');
      process.exit(1);
    }

    await testAuthFlow();

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    cleanup();
  }
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

main();