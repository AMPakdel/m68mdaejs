const asar = require('@electron/asar');

const src = '../asar';
const dest = '../lib.asar';

asar.createPackage(src, dest).then(()=>{
    console.log('done.');
})

