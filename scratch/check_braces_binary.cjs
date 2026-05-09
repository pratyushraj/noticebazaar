const fs = require('fs');
const content = fs.readFileSync('src/pages/MobileDashboardDemo.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
for (let i = 860; i < 8662; i++) {
    const line = lines[i];
    const opens = (line.match(/{/g) || []).length;
    const closes = (line.match(/}/g) || []).length;
    balance += opens - closes;
    if (balance === 0 && i < 8661) {
        // This should not happen until the end of the component
        // unless there are multiple top-level blocks? 
        // But MobileDashboardDemo is one big function.
    }
}
console.log(`End of MobileDashboardDemo (Line 8662): Balance = ${balance}`);

balance = 0;
for (let i = 860; i < 8662; i++) {
    const line = lines[i];
    const opens = (line.match(/{/g) || []).length;
    const closes = (line.match(/}/g) || []).length;
    balance += opens - closes;
    if (i % 500 === 0) {
         console.log(`Line ${i+1}: Balance = ${balance}`);
    }
}
