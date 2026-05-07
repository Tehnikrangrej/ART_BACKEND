const prisma = require('../src/prismaClient');
console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('_') && typeof prisma[k] === 'object' && prisma[k] !== null));
process.exit(0);
