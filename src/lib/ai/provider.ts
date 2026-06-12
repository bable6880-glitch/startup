export interface AIProvider {
    name: string;
    chat(messages: { role: string; content: string }[], systemPrompt?: string): Promise<string>;
}

export class OpenAIProvider implements AIProvider {
    name = 'openai';

    async chat(messages: { role: string; content: string }[], systemPrompt?: string): Promise<string> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

        const formattedMessages = [];
        if (systemPrompt) {
            formattedMessages.push({ role: "system", content: systemPrompt });
        }
        formattedMessages.push(...messages);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        try {
            const res = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: formattedMessages,
                    max_tokens: 500
                }),
                signal: controller.signal
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`OpenAI API Error ${res.status}: ${errorText}`);
            }

            const data = await res.json();
            return data.choices[0].message.content;
        } finally {
            clearTimeout(timeoutId);
        }
    }
}

export class GeminiProvider implements AIProvider {
    name = 'gemini';

    async chat(messages: { role: string; content: string }[], systemPrompt?: string): Promise<string> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

        // Convert messages to Gemini format
        const contents = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        const body: any = { contents };
        if (systemPrompt) {
            body.systemInstruction = { parts: [{ text: systemPrompt }] };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Gemini API Error ${res.status}: ${errorText}`);
            }

            const data = await res.json();
            return data.candidates[0].content.parts[0].text;
        } finally {
            clearTimeout(timeoutId);
        }
    }
}

export class AnthropicProvider implements AIProvider {
    name = 'anthropic';

    async chat(messages: { role: string; content: string }[], systemPrompt?: string): Promise<string> {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const res = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 500,
                    system: systemPrompt,
                    messages: messages
                }),
                signal: controller.signal
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Anthropic API Error ${res.status}: ${errorText}`);
            }

            const data = await res.json();
            return data.content[0].text;
        } finally {
            clearTimeout(timeoutId);
        }
    }
}
