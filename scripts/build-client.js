const fs = require('fs');
const path = require('path');

//---]>

const genClientLib = require('./../src/genClientLib');

//--------------------------------------------------

const write = (name, d) => fs.writeFileSync(path.join(__dirname, '..', 'client', name + '.js'), d);

//---]>

console.log('[gen] start');
console.log('--------------');
console.time('|gen');

const lib = genClientLib();

//---]>

write('dist.index', lib.dist);
write('common.index', lib.common);
write('index', lib.es6);

//---]>

console.timeEnd('|gen');
console.log('--------------');
console.log('[gen] done');
