// startup.js - Production startup script for Azure
process.env.NODE_ENV = 'production';
require('tsx/cjs').register();
require('./server/index.ts');
