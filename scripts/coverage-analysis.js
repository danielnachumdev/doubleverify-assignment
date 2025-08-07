#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Coverage Analysis Script
 * Analyzes Jest coverage reports and provides detailed insights
 */

const COVERAGE_DIR = path.join(__dirname, '..', 'coverage');
const COVERAGE_JSON = path.join(COVERAGE_DIR, 'coverage-final.json');

function analyzeCoverage() {
  console.log('🔍 Analyzing test coverage...\n');

  if (!fs.existsSync(COVERAGE_JSON)) {
    console.error('❌ Coverage report not found. Run "npm run test:coverage" first.');
    process.exit(1);
  }

  const coverageData = JSON.parse(fs.readFileSync(COVERAGE_JSON, 'utf8'));
  
  const analysis = {
    totalFiles: 0,
    fullyTested: 0,
    needsImprovement: [],
    summary: {
      statements: { covered: 0, total: 0 },
      branches: { covered: 0, total: 0 },
      functions: { covered: 0, total: 0 },
      lines: { covered: 0, total: 0 }
    }
  };

  // Analyze each file
  Object.entries(coverageData).forEach(([filePath, data]) => {
    analysis.totalFiles++;
    
    // Accumulate totals
    analysis.summary.statements.covered += data.s ? Object.values(data.s).filter(v => v > 0).length : 0;
    analysis.summary.statements.total += data.s ? Object.keys(data.s).length : 0;
    
    analysis.summary.branches.covered += data.b ? Object.values(data.b).flat().filter(v => v > 0).length : 0;
    analysis.summary.branches.total += data.b ? Object.values(data.b).flat().length : 0;
    
    analysis.summary.functions.covered += data.f ? Object.values(data.f).filter(v => v > 0).length : 0;
    analysis.summary.functions.total += data.f ? Object.keys(data.f).length : 0;
    
    analysis.summary.lines.covered += Object.values(data.statementMap || {}).length;
    analysis.summary.lines.total += Object.keys(data.statementMap || {}).length;

    // Calculate file-level coverage
    const fileStats = {
      file: filePath.replace(process.cwd(), '').replace(/\\/g, '/'),
      statements: calculatePercentage(data.s),
      branches: calculatePercentage(data.b, true),
      functions: calculatePercentage(data.f),
      lines: calculatePercentage(data.statementMap)
    };

    // Check if file needs improvement
    if (fileStats.statements < 90 || fileStats.branches < 85 || fileStats.functions < 90) {
      analysis.needsImprovement.push(fileStats);
    } else {
      analysis.fullyTested++;
    }
  });

  // Display results
  displayResults(analysis);
}

function calculatePercentage(data, isBranches = false) {
  if (!data) return 100;
  
  let covered, total;
  
  if (isBranches) {
    const branches = Object.values(data).flat();
    covered = branches.filter(v => v > 0).length;
    total = branches.length;
  } else {
    covered = Object.values(data).filter(v => v > 0).length;
    total = Object.keys(data).length;
  }
  
  return total === 0 ? 100 : Math.round((covered / total) * 100);
}

function displayResults(analysis) {
  console.log('📊 COVERAGE ANALYSIS RESULTS');
  console.log('=' .repeat(50));
  
  // Overall summary
  const stmtPct = Math.round((analysis.summary.statements.covered / analysis.summary.statements.total) * 100);
  const branchPct = Math.round((analysis.summary.branches.covered / analysis.summary.branches.total) * 100);
  const funcPct = Math.round((analysis.summary.functions.covered / analysis.summary.functions.total) * 100);
  
  console.log(`\n📈 Overall Coverage:`);
  console.log(`   Statements: ${stmtPct}% (${analysis.summary.statements.covered}/${analysis.summary.statements.total})`);
  console.log(`   Branches:   ${branchPct}% (${analysis.summary.branches.covered}/${analysis.summary.branches.total})`);
  console.log(`   Functions:  ${funcPct}% (${analysis.summary.functions.covered}/${analysis.summary.functions.total})`);
  
  console.log(`\n📁 File Summary:`);
  console.log(`   Total files: ${analysis.totalFiles}`);
  console.log(`   Fully tested: ${analysis.fullyTested}`);
  console.log(`   Need improvement: ${analysis.needsImprovement.length}`);
  
  // Files needing improvement
  if (analysis.needsImprovement.length > 0) {
    console.log(`\n⚠️  Files needing improvement:`);
    console.log('-'.repeat(80));
    console.log('File'.padEnd(40) + 'Stmt%'.padEnd(8) + 'Branch%'.padEnd(10) + 'Func%'.padEnd(8));
    console.log('-'.repeat(80));
    
    analysis.needsImprovement
      .sort((a, b) => (a.statements + a.branches + a.functions) - (b.statements + b.branches + b.functions))
      .forEach(file => {
        const fileName = file.file.length > 35 ? '...' + file.file.slice(-32) : file.file;
        console.log(
          fileName.padEnd(40) +
          `${file.statements}%`.padEnd(8) +
          `${file.branches}%`.padEnd(10) +
          `${file.functions}%`.padEnd(8)
        );
      });
  }
  
  // Recommendations
  console.log(`\n💡 Recommendations:`);
  if (branchPct < 90) {
    console.log('   • Add more tests for conditional logic and error handling');
  }
  if (funcPct < 95) {
    console.log('   • Ensure all functions have dedicated test cases');
  }
  if (analysis.needsImprovement.length > 0) {
    console.log('   • Focus on the files listed above for coverage improvement');
  }
  if (analysis.fullyTested === analysis.totalFiles) {
    console.log('   🎉 Excellent! All files meet coverage thresholds');
  }
  
  console.log(`\n📋 Next Steps:`);
  console.log('   1. Run "npm run test:coverage:html" to view detailed HTML report');
  console.log('   2. Focus on uncovered branches and functions');
  console.log('   3. Add edge case tests for better branch coverage');
  
  console.log('\n' + '='.repeat(50));
}

// Run the analysis
if (require.main === module) {
  analyzeCoverage();
}

module.exports = { analyzeCoverage };