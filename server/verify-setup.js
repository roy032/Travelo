/**
 * Setup Verification Script
 * Verifies that all infrastructure components are properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Travel Planner Server Setup...\n');

let allChecksPass = true;

// Check 1: Environment file exists
console.log('1. Checking .env file...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✓ .env file exists');
} else {
  console.log('   ✗ .env file not found');
  allChecksPass = false;
}

// Check 2: Database configuration file exists
console.log('\n2. Checking database configuration...');
const dbConfigPath = path.join(__dirname, 'src', 'config', 'database.js');
if (fs.existsSync(dbConfigPath)) {
  console.log('   ✓ database.js exists');

  // Try to import it
  try {
    const { default: connectDatabase } = await import('./src/config/database.js');
    if (typeof connectDatabase === 'function') {
      console.log('   ✓ connectDatabase function is properly exported');
    } else {
      console.log('   ✗ connectDatabase is not a function');
      allChecksPass = false;
    }
  } catch (error) {
    console.log(`   ✗ Error importing database config: ${error.message}`);
    allChecksPass = false;
  }
} else {
  console.log('   ✗ database.js not found');
  allChecksPass = false;
}

// Check 3: Upload directories exist
console.log('\n3. Checking upload directories...');
const uploadDirs = ['documents', 'receipts', 'photos'];
const uploadsBasePath = path.join(__dirname, 'uploads');

if (fs.existsSync(uploadsBasePath)) {
  console.log('   ✓ uploads/ directory exists');

  for (const dir of uploadDirs) {
    const dirPath = path.join(uploadsBasePath, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`   ✓ uploads/${dir}/ exists`);

      // Check for .gitkeep
      const gitkeepPath = path.join(dirPath, '.gitkeep');
      if (fs.existsSync(gitkeepPath)) {
        console.log(`   ✓ uploads/${dir}/.gitkeep exists`);
      } else {
        console.log(`   ⚠ uploads/${dir}/.gitkeep not found (optional)`);
      }
    } else {
      console.log(`   ✗ uploads/${dir}/ not found`);
      allChecksPass = false;
    }
  }
} else {
  console.log('   ✗ uploads/ directory not found');
  allChecksPass = false;
}

// Check 4: Server files exist
console.log('\n4. Checking server files...');
const serverFiles = [
  'src/index.js',
  'src/server.js',
  'src/app.js'
];

for (const file of serverFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file} exists`);
  } else {
    console.log(`   ✗ ${file} not found`);
    allChecksPass = false;
  }
}

// Check 5: .gitignore exists
console.log('\n5. Checking .gitignore...');
const gitignorePath = path.join(__dirname, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  console.log('   ✓ .gitignore exists');

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignoreContent.includes('uploads/documents/*')) {
    console.log('   ✓ .gitignore configured for uploads');
  } else {
    console.log('   ⚠ .gitignore may not be properly configured for uploads');
  }
} else {
  console.log('   ✗ .gitignore not found');
  allChecksPass = false;
}

// Check 6: Dependencies installed
console.log('\n6. Checking dependencies...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✓ node_modules exists');

  const requiredPackages = ['express', 'mongoose', 'dotenv', 'bcrypt', 'jsonwebtoken'];
  for (const pkg of requiredPackages) {
    const pkgPath = path.join(nodeModulesPath, pkg);
    if (fs.existsSync(pkgPath)) {
      console.log(`   ✓ ${pkg} installed`);
    } else {
      console.log(`   ✗ ${pkg} not installed`);
      allChecksPass = false;
    }
  }
} else {
  console.log('   ✗ node_modules not found - run npm install');
  allChecksPass = false;
}

// Final summary
console.log('\n' + '='.repeat(50));
if (allChecksPass) {
  console.log('✅ All checks passed! Server infrastructure is ready.');
  console.log('\nNext steps:');
  console.log('1. Ensure MongoDB is installed and running');
  console.log('2. Update JWT_SECRET in .env file');
  console.log('3. Run: npm start (or npm run dev for development)');
} else {
  console.log('❌ Some checks failed. Please review the errors above.');
  process.exit(1);
}
console.log('='.repeat(50));
