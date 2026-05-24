const { Redis } = require('@upstash/redis');
require('dotenv').config({ path: './.env.local' });

async function main() {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
        console.log("No Upstash Redis URL found");
        return;
    }
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
    });

    try {
        console.log("Connected to Redis successfully!");
        
        // Find all keys
        // Note: scan or keys is supported by Upstash
        const keys = await redis.keys('*');
        console.log("Redis keys:", keys);

        for (const key of keys) {
            const val = await redis.get(key);
            console.log(`Key: ${key}`);
            console.log("Value type:", typeof val);
            console.log("Value:", JSON.stringify(val, null, 2));
            console.log("-------------------");
        }
    } catch (e) {
        console.error(e);
    }
}

main();
