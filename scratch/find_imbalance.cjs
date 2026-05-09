const fs = require('fs');
const content = fs.readFileSync('src/pages/MobileDashboardDemo.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/{/g) || []).length;
    const closes = (line.match(/}/g) || []).length;
    balance += opens - closes;
    if (i > 860 && i < 5443) {
        if (balance < 1) {
             console.log(`Line ${i+1}: Balance dropped below 1 (${balance}) - ${line.trim()}`);
        }
    }
    // Check for "const x = ... => {" followed by something that doesn't close it correctly
}
console.log(`Final balance: ${balance}`);
