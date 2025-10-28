const fs = require('fs');
const path = require('path');

// 재귀적으로 파일 찾기
function findFiles(dir, pattern, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.next') && !filePath.includes('.git')) {
        findFiles(filePath, pattern, fileList);
      }
    } else if (file.match(pattern)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// super_admin을 admin으로 치환
function replaceSuperAdmin() {
  console.log('Starting super_admin to admin replacement...\n');

  const rootDir = path.join(__dirname, '..');
  const tsFiles = [
    ...findFiles(path.join(rootDir, 'app'), /\.ts$/),
    ...findFiles(path.join(rootDir, 'lib'), /\.ts$/)
  ];

  let totalReplaced = 0;
  let filesModified = 0;

  tsFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      if (content.includes("'super_admin'")) {
        const newContent = content.replace(/('super_admin')/g, "'admin'");
        fs.writeFileSync(filePath, newContent, 'utf8');

        const count = (content.match(/('super_admin')/g) || []).length;
        totalReplaced += count;
        filesModified++;

        console.log(`✓ ${path.relative(rootDir, filePath)}: ${count} replacement(s)`);
      }
    } catch (error) {
      console.error(`✗ Error processing ${filePath}:`, error.message);
    }
  });

  console.log(`\n✅ Replacement complete!`);
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Total replacements: ${totalReplaced}`);
}

replaceSuperAdmin();
