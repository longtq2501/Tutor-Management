/* eslint-disable */
const fs = require('fs');
const path = require('path');

const filePath = 'lint_results_v13.json';
const outputFile = 'error_summary_v13.txt';

try {
    const content = fs.readFileSync(filePath, 'utf8');
    const jsonStart = content.indexOf('[');
    if (jsonStart === -1) throw new Error('Could not find start of JSON array');
    const rawData = content.substring(jsonStart);
    const data = JSON.parse(rawData);

    const fileErrors = data.map(f => ({
        path: f.filePath,
        errors: f.messages.filter(m => m.severity === 2).length,
        messages: f.messages.filter(m => m.severity === 2).map(m => `${m.ruleId}: ${m.message} (Line ${m.line})`)
    })).filter(f => f.errors > 0);

    fileErrors.sort((a, b) => b.errors - a.errors);

    let output = `Total files with errors: ${fileErrors.length}\n`;
    output += `Total errors: ${fileErrors.reduce((acc, f) => acc + f.errors, 0)}\n\n`;

    fileErrors.forEach(f => {
        output += `${f.errors} errors in ${path.relative(process.cwd(), f.path)}\n`;
        f.messages.slice(0, 10).forEach(m => output += `  - ${m}\n`);
        if (f.messages.length > 10) output += `  ... and ${f.messages.length - 10} more\n`;
        output += '\n';
    });

    fs.writeFileSync(outputFile, output);
    console.log(`Error summary saved to ${outputFile}`);
} catch (err) {
    console.error('Error processing lint results:', err);
    process.exit(1);
}
