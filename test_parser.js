const { MT940Parser } = require('./src/parser.js');

const sampleContent = `:20:STARTSTAT
:25:DEUTDEDE/12345678
:28:0000000001/001
:60:F060101EUR1000,00
:61:0601010601C100,00NMSCTEST///REF001
:86:Sample Transaction Description Line 1
:61:0601020602D250,50NMSCTEST///REF002
:86:Another Transaction Description
:61:0601030603C500,00NMSCTEST///REF003
:86:Third Transaction Details
:62:F060131EUR1349,50
-`;

try {
  const parser = new MT940Parser();
  const result = parser.parse(sampleContent);
  console.log('Parsed successfully!');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Parse error:', error.message);
}
