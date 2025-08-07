#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Test Report Generator
 * Generates comprehensive test reports with coverage analysis
 */

const REPORTS_DIR = path.join(__dirname, '..', 'test-reports');
const COVERAGE_DIR = path.join(__dirname, '..', 'coverage');

function generateTestReport() {
  console.log('📋 Generating comprehensive test report...\n');

  // Ensure reports directory exists
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    project: 'ATM System',
    version: getPackageVersion(),
    summary: {},
    coverage: {},
    testSuites: {},
    recommendations: []
  };

  try {
    // Run tests with coverage
    console.log('🧪 Running tests with coverage...');
    const testOutput = execSync('npm run test:coverage', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Parse test results
    report.summary = parseTestSummary(testOutput);
    
    // Parse coverage data
    if (fs.existsSync(path.join(COVERAGE_DIR, 'coverage-final.json'))) {
      report.coverage = parseCoverageData();
    }
    
    // Generate recommendations
    report.recommendations = generateRecommendations(report);
    
    // Save report
    const reportPath = path.join(REPORTS_DIR, `test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    generateHtmlReport(report);
    
    console.log('✅ Test report generated successfully!');
    console.log(`📄 JSON Report: ${reportPath}`);
    console.log(`🌐 HTML Report: ${path.join(REPORTS_DIR, 'test-report.html')}`);
    
  } catch (error) {
    console.error('❌ Error generating test report:', error.message);
    process.exit(1);
  }
}

function getPackageVersion() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  return packageJson.version;
}

function parseTestSummary(output) {
  const lines = output.split('\n');
  const summary = {
    testSuites: { passed: 0, total: 0 },
    tests: { passed: 0, total: 0 },
    snapshots: { total: 0 },
    time: '0s'
  };

  lines.forEach(line => {
    if (line.includes('Test Suites:')) {
      const match = line.match(/Test Suites: (\d+) passed, (\d+) total/);
      if (match) {
        summary.testSuites.passed = parseInt(match[1]);
        summary.testSuites.total = parseInt(match[2]);
      }
    }
    if (line.includes('Tests:')) {
      const match = line.match(/Tests: (\d+) passed, (\d+) total/);
      if (match) {
        summary.tests.passed = parseInt(match[1]);
        summary.tests.total = parseInt(match[2]);
      }
    }
    if (line.includes('Time:')) {
      const match = line.match(/Time: ([\\d.]+s)/);
      if (match) {
        summary.time = match[1];
      }
    }
  });

  return summary;
}

function parseCoverageData() {
  const coverageFile = path.join(COVERAGE_DIR, 'coverage-final.json');
  const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
  
  const summary = {
    statements: { covered: 0, total: 0, percentage: 0 },
    branches: { covered: 0, total: 0, percentage: 0 },
    functions: { covered: 0, total: 0, percentage: 0 },
    lines: { covered: 0, total: 0, percentage: 0 },
    files: []
  };

  Object.entries(coverageData).forEach(([filePath, data]) => {
    const fileStats = {
      path: filePath.replace(process.cwd(), '').replace(/\\/g, '/'),
      statements: calculateCoverage(data.s),
      branches: calculateCoverage(data.b, true),
      functions: calculateCoverage(data.f),
      lines: Object.keys(data.statementMap || {}).length
    };

    summary.files.push(fileStats);
    
    // Accumulate totals
    if (data.s) {
      summary.statements.covered += Object.values(data.s).filter(v => v > 0).length;
      summary.statements.total += Object.keys(data.s).length;
    }
    
    if (data.b) {
      const branches = Object.values(data.b).flat();
      summary.branches.covered += branches.filter(v => v > 0).length;
      summary.branches.total += branches.length;
    }
    
    if (data.f) {
      summary.functions.covered += Object.values(data.f).filter(v => v > 0).length;
      summary.functions.total += Object.keys(data.f).length;
    }
  });

  // Calculate percentages
  summary.statements.percentage = Math.round((summary.statements.covered / summary.statements.total) * 100);
  summary.branches.percentage = Math.round((summary.branches.covered / summary.branches.total) * 100);
  summary.functions.percentage = Math.round((summary.functions.covered / summary.functions.total) * 100);

  return summary;
}

function calculateCoverage(data, isBranches = false) {
  if (!data) return { covered: 0, total: 0, percentage: 100 };
  
  let covered, total;
  
  if (isBranches) {
    const branches = Object.values(data).flat();
    covered = branches.filter(v => v > 0).length;
    total = branches.length;
  } else {
    covered = Object.values(data).filter(v => v > 0).length;
    total = Object.keys(data).length;
  }
  
  const percentage = total === 0 ? 100 : Math.round((covered / total) * 100);
  
  return { covered, total, percentage };
}

function generateRecommendations(report) {
  const recommendations = [];
  
  if (report.coverage.branches && report.coverage.branches.percentage < 90) {
    recommendations.push({
      type: 'coverage',
      priority: 'high',
      message: 'Branch coverage is below 90%. Add more tests for conditional logic and error handling.'
    });
  }
  
  if (report.coverage.functions && report.coverage.functions.percentage < 95) {
    recommendations.push({
      type: 'coverage',
      priority: 'medium',
      message: 'Function coverage is below 95%. Ensure all functions have dedicated test cases.'
    });
  }
  
  if (report.summary.tests.passed < report.summary.tests.total) {
    recommendations.push({
      type: 'tests',
      priority: 'critical',
      message: 'Some tests are failing. Fix failing tests before deployment.'
    });
  }
  
  // Check for files with low coverage
  if (report.coverage.files) {
    const lowCoverageFiles = report.coverage.files.filter(file => 
      file.statements.percentage < 90 || file.branches.percentage < 85
    );
    
    if (lowCoverageFiles.length > 0) {
      recommendations.push({
        type: 'coverage',
        priority: 'medium',
        message: `${lowCoverageFiles.length} files have low coverage. Focus on: ${lowCoverageFiles.map(f => f.path).join(', ')}`
      });
    }
  }
  
  return recommendations;
}

function generateHtmlReport(report) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - ${report.project}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .card.success { border-left-color: #28a745; }
        .card.warning { border-left-color: #ffc107; }
        .card.danger { border-left-color: #dc3545; }
        .metric { font-size: 2em; font-weight: bold; color: #333; }
        .label { color: #666; font-size: 0.9em; }
        .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .progress-fill.high { background: #28a745; }
        .progress-fill.medium { background: #ffc107; }
        .progress-fill.low { background: #dc3545; }
        .recommendations { margin-top: 30px; }
        .recommendation { padding: 15px; margin: 10px 0; border-radius: 5px; }
        .recommendation.critical { background: #f8d7da; border: 1px solid #f5c6cb; }
        .recommendation.high { background: #fff3cd; border: 1px solid #ffeaa7; }
        .recommendation.medium { background: #d1ecf1; border: 1px solid #bee5eb; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Report</h1>
            <h2>${report.project} v${report.version}</h2>
            <p class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="card ${report.summary.tests.passed === report.summary.tests.total ? 'success' : 'danger'}">
                <div class="metric">${report.summary.tests.passed}/${report.summary.tests.total}</div>
                <div class="label">Tests Passed</div>
            </div>
            
            <div class="card ${report.summary.testSuites.passed === report.summary.testSuites.total ? 'success' : 'danger'}">
                <div class="metric">${report.summary.testSuites.passed}/${report.summary.testSuites.total}</div>
                <div class="label">Test Suites</div>
            </div>
            
            <div class="card">
                <div class="metric">${report.summary.time}</div>
                <div class="label">Execution Time</div>
            </div>
        </div>

        ${report.coverage.statements ? `
        <h3>📊 Coverage Summary</h3>
        <div class="summary">
            <div class="card">
                <div class="metric">${report.coverage.statements.percentage}%</div>
                <div class="label">Statements</div>
                <div class="progress-bar">
                    <div class="progress-fill ${getCoverageClass(report.coverage.statements.percentage)}" 
                         style="width: ${report.coverage.statements.percentage}%"></div>
                </div>
            </div>
            
            <div class="card">
                <div class="metric">${report.coverage.branches.percentage}%</div>
                <div class="label">Branches</div>
                <div class="progress-bar">
                    <div class="progress-fill ${getCoverageClass(report.coverage.branches.percentage)}" 
                         style="width: ${report.coverage.branches.percentage}%"></div>
                </div>
            </div>
            
            <div class="card">
                <div class="metric">${report.coverage.functions.percentage}%</div>
                <div class="label">Functions</div>
                <div class="progress-bar">
                    <div class="progress-fill ${getCoverageClass(report.coverage.functions.percentage)}" 
                         style="width: ${report.coverage.functions.percentage}%"></div>
                </div>
            </div>
        </div>
        ` : ''}

        ${report.recommendations.length > 0 ? `
        <div class="recommendations">
            <h3>💡 Recommendations</h3>
            ${report.recommendations.map(rec => `
                <div class="recommendation ${rec.priority}">
                    <strong>${rec.type.toUpperCase()}:</strong> ${rec.message}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div style="margin-top: 30px; text-align: center; color: #666;">
            <p>For detailed coverage information, open <code>coverage/index.html</code></p>
        </div>
    </div>
</body>
</html>`;

  fs.writeFileSync(path.join(REPORTS_DIR, 'test-report.html'), html);
}

function getCoverageClass(percentage) {
  if (percentage >= 90) return 'high';
  if (percentage >= 75) return 'medium';
  return 'low';
}

// Run the report generator
if (require.main === module) {
  generateTestReport();
}

module.exports = { generateTestReport };