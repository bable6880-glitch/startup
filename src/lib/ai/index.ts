import { AIProvider, OpenAIProvider, GeminiProvider, AnthropicProvider, OpenRouterProvider } from './provider';

export function getConfiguredProviders(): AIProvider[] {
    const providers: AIProvider[] = [];
    
    // Explicit primary provider override
    const primary = process.env.AI_PROVIDER?.toLowerCase();
    
    if (primary === 'openai' && process.env.OPENAI_API_KEY) providers.push(new OpenAIProvider());
    if (primary === 'gemini' && process.env.GEMINI_API_KEY) providers.push(new GeminiProvider());
    if (primary === 'anthropic' && process.env.ANTHROPIC_API_KEY) providers.push(new AnthropicProvider());
    if (primary === 'openrouter' && process.env.OPENROUTER_API_KEY) providers.push(new OpenRouterProvider());

    // Add remaining available providers as fallbacks
    if (primary !== 'openai' && process.env.OPENAI_API_KEY) providers.push(new OpenAIProvider());
    if (primary !== 'gemini' && process.env.GEMINI_API_KEY) providers.push(new GeminiProvider());
    if (primary !== 'anthropic' && process.env.ANTHROPIC_API_KEY) providers.push(new AnthropicProvider());
    if (primary !== 'openrouter' && process.env.OPENROUTER_API_KEY) providers.push(new OpenRouterProvider());

    return providers;
}
