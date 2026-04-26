const fs = require('fs');
const content = fs.readFileSync('/Users/pratyushraj/Desktop/creatorarmour/src/pages/MobileDashboardDemo.tsx', 'utf8');
const lines = content.split('\n');

const start = 3346 - 1;
const end = 4572 - 1;

let braceCount = 0;
let parenCount = 0;
let jsxCount = 0;

for (let i = start; i <= end; i++) {
    const line = lines[i];
    for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
        // Simple JSX tag matching is hard, but let's check basic balancability
    }
}

console.log(`Braces: ${braceCount}`);
console.log(`Parens: ${parenCount}`);
