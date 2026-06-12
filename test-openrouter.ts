import { config } from "dotenv";
config({ path: ".env.local" });

import { OpenRouterProvider } from "./src/lib/ai/provider";

async function run() {
    console.log("Testing OpenRouter API...");
    try {
        const provider = new OpenRouterProvider();
        const response = await provider.chat([
            { role: "user", content: "Suggest 5 menu items to complement biryani" }
        ], "You are a helpful chef assistant.");
        console.log("\n[SUCCESS] Response received:\n");
        console.log(response);
    } catch (error) {
        console.error("\n[ERROR]", error);
    }
}

run();
