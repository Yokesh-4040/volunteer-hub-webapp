const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the current version file
const versionPath = path.join(__dirname, '../src/config/version.ts');
const versionContent = fs.readFileSync(versionPath, 'utf8');

// Get the current git commit message
const commitMsg = execSync('git log -1 --pretty=%B').toString().trim().toLowerCase();
const gitSha = execSync('git rev-parse --short HEAD').toString().trim();

// Extract current version numbers
const majorMatch = versionContent.match(/major: (\d+),/);
const minorMatch = versionContent.match(/minor: (\d+),/);
const patchMatch = versionContent.match(/patch: (\d+),/);

let major = parseInt(majorMatch[1]);
let minor = parseInt(minorMatch[1]);
let patch = parseInt(patchMatch[1]);

// Update version based on commit message
if (commitMsg.includes('[major]')) {
  major++;
  minor = 0;
  patch = 0;
} else if (commitMsg.includes('[minor]')) {
  minor++;
  patch = 0;
} else if (commitMsg.includes('[patch]')) {
  patch++;
}

// Update the version file
const updatedContent = versionContent
  .replace(/major: \d+,/, `major: ${major},`)
  .replace(/minor: \d+,/, `minor: ${minor},`)
  .replace(/patch: \d+,/, `patch: ${patch},`)
  .replace(/build: .*?,/, `build: '${gitSha}',`);

fs.writeFileSync(versionPath, updatedContent);
console.log(`Updated version to v${major}.${minor}.${patch}-${gitSha}`); 