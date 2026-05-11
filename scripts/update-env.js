const fs = require('fs');

const envFile = '.env.local';
let content = fs.readFileSync(envFile, 'utf8');

const lines = content.split('\n').filter(line => 
    !line.startsWith('STRIPE_ORDER_PACK_') && 
    !line.startsWith('STRIPE_POTLUCK_PACK_')
);

const newLines = [
    'STRIPE_ORDER_PACK_50=price_1TVaAc9ziYoIUs2hr6jDdyZf',
    'STRIPE_ORDER_PACK_100=price_1TVaAd9ziYoIUs2hk3fnp1AV',
    'STRIPE_ORDER_PACK_200=price_1TVaAd9ziYoIUs2hMObIZZHw',
    'STRIPE_ORDER_PACK_400=price_1TVaAe9ziYoIUs2h5Z73f0TT',
    'STRIPE_POTLUCK_PACK_5=price_1TVaAf9ziYoIUs2hcNZZYoHY',
    'STRIPE_POTLUCK_PACK_11=price_1TVaAg9ziYoIUs2hiWEwqtIA',
    'STRIPE_POTLUCK_PACK_15=price_1TVaAh9ziYoIUs2hTxp2O3Tv',
    'STRIPE_POTLUCK_PACK_20=price_1TVaAi9ziYoIUs2hSr3zx1VB'
];

fs.writeFileSync(envFile, lines.join('\n') + (lines.length > 0 && lines[lines.length-1] !== '' ? '\n' : '') + newLines.join('\n') + '\n');
console.log('Updated .env.local');
