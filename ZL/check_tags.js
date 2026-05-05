const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf-8');
const openDiv = (content.match(/<div/g) || []).length;
const closeDiv = (content.match(/<\/div>/g) || []).length;
console.log('div tags:', openDiv, closeDiv, openDiv === closeDiv ? 'OK' : 'MISMATCH');
