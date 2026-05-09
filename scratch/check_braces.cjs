const fs = require('fs');
const content = fs.readFileSync('src/pages/MobileDashboardDemo.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
const checkpoints = [8662, 8818, 9239, 9369, 9726];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/{/g) || []).length;
    const closes = (line.match(/}/g) || []).length;
    balance += opens - closes;
    if (checkpoints.includes(i + 1)) {
        console.log(`Line ${i + 1}: Balance = ${balance}`);
    }
}
