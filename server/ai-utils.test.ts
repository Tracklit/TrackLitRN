import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cleanAIResponse,
  blockFocusDescriptions,
  buildGenerateSystemPrompt,
  buildGenerateUserPrompt,
  buildRegenerateSystemPrompt,
  buildRegenerateUserPrompt,
  callAriaApi,
} from './ai-utils';

// ─── cleanAIResponse ────────────────────────────────────────────────

describe('cleanAIResponse', () => {
  // --- Passthrough / edge cases ---

  it('returns empty string unchanged', () => {
    expect(cleanAIResponse('', 'hello')).toBe('');
  });

  it('returns undefined/null unchanged (falsy guard)', () => {
    // The function checks `if (!response)` so null/undefined should pass through
    expect(cleanAIResponse(null as any, 'hello')).toBe(null);
    expect(cleanAIResponse(undefined as any, 'hello')).toBe(undefined);
  });

  it('returns clean text unchanged', () => {
    const text = 'This is a great training program with 4 blocks.';
    expect(cleanAIResponse(text, 'generate a program')).toBe(text);
  });

  // --- JSON wrapper removal ---

  it('removes markdown code block fences (```json ... ```)', () => {
    const input = '```json\n{"program": "content here"}\n```';
    const result = cleanAIResponse(input, 'generate');
    expect(result).not.toContain('```');
  });

  it('removes markdown code block fences (``` ... ```)', () => {
    const input = '```\nHere is a training program\n```';
    const result = cleanAIResponse(input, 'generate');
    expect(result).not.toContain('```');
    expect(result).toContain('Here is a training program');
  });

  it('removes JSON object wrapper with field name', () => {
    const input = '{"response": "Here is your program content"';
    const result = cleanAIResponse(input, 'generate');
    expect(result).toContain('Here is your program content');
  });

  it('removes array brackets', () => {
    const input = '[ Training program details here ]';
    const result = cleanAIResponse(input, 'generate');
    expect(result).toBe('Training program details here');
  });

  it('removes escaped quotes', () => {
    const input = 'Use \\"interval training\\" for best results';
    const result = cleanAIResponse(input, 'generate');
    expect(result).toBe('Use "interval training" for best results');
  });

  it('removes leading/trailing double quotes', () => {
    const input = '"This is the program content"';
    const result = cleanAIResponse(input, 'generate');
    expect(result).toBe('This is the program content');
  });

  it('removes leading/trailing single quotes', () => {
    const input = "'This is the program content'";
    const result = cleanAIResponse(input, 'generate');
    expect(result).toBe('This is the program content');
  });

  // --- Bibliography removal ---

  it('removes **Bibliography:** section', () => {
    const input = 'Training program content here.\n\n**Bibliography:**\n1. Smith, J. (2020). Running Science.';
    const result = cleanAIResponse(input, 'generate a program');
    expect(result).toBe('Training program content here.');
  });

  it('removes **References:** section', () => {
    const input = 'Program content.\n\n**References:**\nSome reference list here.';
    const result = cleanAIResponse(input, 'create a plan');
    expect(result).toBe('Program content.');
  });

  it('removes **Sources:** section', () => {
    const input = 'Content here.\n\n**Sources:**\nSource 1, Source 2';
    const result = cleanAIResponse(input, 'make a program');
    expect(result).toBe('Content here.');
  });

  it('removes plain bibliography: section', () => {
    const input = 'Content here.\n\nbibliography:\nSome books listed';
    const result = cleanAIResponse(input, 'generate');
    expect(result).toBe('Content here.');
  });

  it('removes "Check out" book references', () => {
    const input = 'Great training plan.\n\nCheck out "The Science of Running" for more details.';
    const result = cleanAIResponse(input, 'generate');
    expect(result).toBe('Great training plan.');
  });

  it('removes "Additionally, the book..." references', () => {
    const input = 'Train hard.\n\nAdditionally, the book "Sprint Science" covers this topic in depth.';
    const result = cleanAIResponse(input, 'generate');
    expect(result).toBe('Train hard.');
  });

  it('removes "For more information, see..." references', () => {
    const input = 'Sprint workout details.\n\nFor more information, see these resources.';
    const result = cleanAIResponse(input, 'generate');
    expect(result).toBe('Sprint workout details.');
  });

  it('preserves bibliography when user asks about a source', () => {
    const input = 'Content.\n\n**Bibliography:**\n1. Smith, J. (2020).';
    const result = cleanAIResponse(input, 'What is the source for this?');
    expect(result).toContain('Bibliography');
  });

  it('removes bibliography even when user says "sources" (plural - no word boundary match)', () => {
    // Note: the regex uses \bsource\b which does NOT match "sources" (plural)
    const input = 'Content.\n\n**Bibliography:**\n1. Smith, J. (2020).';
    const result = cleanAIResponse(input, 'What are your sources?');
    expect(result).not.toContain('Bibliography');
  });

  it('preserves bibliography when user asks about research', () => {
    const input = 'Content.\n\n**References:**\nSome papers.';
    const result = cleanAIResponse(input, 'Show me the research');
    expect(result).toContain('References');
  });

  // --- Whitespace cleanup ---

  it('collapses triple+ newlines to double', () => {
    const input = 'Block 1\n\n\n\nBlock 2';
    const result = cleanAIResponse(input, 'generate');
    expect(result).toBe('Block 1\n\nBlock 2');
  });

  it('trims leading and trailing whitespace', () => {
    const input = '   Program content   ';
    const result = cleanAIResponse(input, 'generate');
    expect(result).toBe('Program content');
  });

  // --- Realistic AI response scenarios ---

  it('handles a realistic JSON-wrapped Aria response', () => {
    const input = '```json\n{"recommendation": "## Week 1\\nMonday: 4x100m sprints\\nTuesday: Gym - Squats 3x8"}\n```';
    const result = cleanAIResponse(input, 'generate program');
    expect(result).toContain('Week 1');
    expect(result).not.toContain('```');
  });

  it('handles multi-paragraph program content cleanly', () => {
    const input = `## Program Overview

This 12-week program focuses on speed development.

## Block 1: Base Phase

Week 1-4: Build aerobic capacity.

## Block 2: Speed Phase

Week 5-8: Increase sprint volume.`;

    const result = cleanAIResponse(input, 'generate');
    expect(result).toContain('Program Overview');
    expect(result).toContain('Block 1');
    expect(result).toContain('Block 2');
  });
});

// ─── blockFocusDescriptions ─────────────────────────────────────────

describe('blockFocusDescriptions', () => {
  it('has all expected block focus types', () => {
    expect(blockFocusDescriptions).toHaveProperty('speed');
    expect(blockFocusDescriptions).toHaveProperty('speed-maintenance');
    expect(blockFocusDescriptions).toHaveProperty('speed-endurance');
    expect(blockFocusDescriptions).toHaveProperty('mixed');
    expect(blockFocusDescriptions).toHaveProperty('short-to-long');
    expect(blockFocusDescriptions).toHaveProperty('long-to-short');
  });

  it('each description is a non-empty string', () => {
    for (const [key, desc] of Object.entries(blockFocusDescriptions)) {
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(10);
    }
  });
});

// ─── buildGenerateSystemPrompt ──────────────────────────────────────

describe('buildGenerateSystemPrompt', () => {
  it('returns a string containing Sprinthia identity', () => {
    const prompt = buildGenerateSystemPrompt();
    expect(prompt).toContain('Sprinthia');
    expect(prompt).toContain('sprint training program design');
  });

  it('includes format instructions', () => {
    const prompt = buildGenerateSystemPrompt();
    expect(prompt).toContain('Program overview and goals');
    expect(prompt).toContain('Block-by-block breakdown');
    expect(prompt).toContain('Recovery and regeneration guidelines');
  });
});

// ─── buildGenerateUserPrompt ────────────────────────────────────────

describe('buildGenerateUserPrompt', () => {
  const baseParams = {
    title: 'Sprint Program',
    description: 'A 12-week sprint program',
    totalLengthWeeks: 12,
    blocks: 3,
    workoutsPerWeek: 5,
    gymWorkoutsPerWeek: 2,
    blockFocus: 'speed',
    aiPrompt: 'Focus on 100m performance',
  };

  it('includes all program parameters in the prompt', () => {
    const prompt = buildGenerateUserPrompt(baseParams);
    expect(prompt).toContain('Sprint Program');
    expect(prompt).toContain('A 12-week sprint program');
    expect(prompt).toContain('12 weeks');
    expect(prompt).toContain('5');
    expect(prompt).toContain('2');
    expect(prompt).toContain('Focus on 100m performance');
  });

  it('resolves block focus to human-readable description', () => {
    const prompt = buildGenerateUserPrompt(baseParams);
    expect(prompt).toContain('maximum speed development with high-intensity sprint work');
    expect(prompt).not.toContain('- Block Focus: speed\n');
  });

  it('falls back to raw blockFocus value if not in descriptions map', () => {
    const prompt = buildGenerateUserPrompt({ ...baseParams, blockFocus: 'custom-focus' });
    expect(prompt).toContain('custom-focus');
  });

  it('uses "None" when aiPrompt is empty', () => {
    const prompt = buildGenerateUserPrompt({ ...baseParams, aiPrompt: undefined });
    expect(prompt).toContain('Specific Requirements:\nNone');
  });

  it('includes periodization instruction with correct block count', () => {
    const prompt = buildGenerateUserPrompt({ ...baseParams, blocks: 4 });
    expect(prompt).toContain('across all 4 blocks');
  });
});

// ─── buildRegenerateSystemPrompt ────────────────────────────────────

describe('buildRegenerateSystemPrompt', () => {
  it('mentions regeneration and fresh alternatives', () => {
    const prompt = buildRegenerateSystemPrompt();
    expect(prompt).toContain('regenerating');
    expect(prompt).toContain('fresh alternatives');
    expect(prompt).toContain('distinctly different');
  });
});

// ─── buildRegenerateUserPrompt ──────────────────────────────────────

describe('buildRegenerateUserPrompt', () => {
  const baseParams = {
    title: 'Sprint Program v2',
    description: 'Regenerated version',
    totalLengthWeeks: 8,
    blocks: 2,
    workoutsPerWeek: 4,
    gymWorkoutsPerWeek: 2,
    blockFocus: 'mixed',
    aiPrompt: 'More plyometrics',
    previousContent: '## Old Program\nWeek 1: Easy runs',
  };

  it('includes all program parameters', () => {
    const prompt = buildRegenerateUserPrompt(baseParams);
    expect(prompt).toContain('Sprint Program v2');
    expect(prompt).toContain('8 weeks');
    expect(prompt).toContain('More plyometrics');
  });

  it('includes the previous content with DO NOT COPY instruction', () => {
    const prompt = buildRegenerateUserPrompt(baseParams);
    expect(prompt).toContain('DO NOT COPY');
    expect(prompt).toContain('## Old Program');
  });

  it('uses "None provided" when previousContent is empty', () => {
    const prompt = buildRegenerateUserPrompt({ ...baseParams, previousContent: undefined });
    expect(prompt).toContain('None provided');
  });

  it('resolves block focus to description', () => {
    const prompt = buildRegenerateUserPrompt(baseParams);
    expect(prompt).toContain('balanced combination');
  });
});

// ─── callAriaApi ────────────────────────────────────────────────────

describe('callAriaApi', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const baseParams = {
    ariaApiUrl: 'https://aria-dev-api.azurewebsites.net',
    userId: '42',
    userPrompt: 'Create a sprint program',
    systemPrompt: 'You are Sprinthia',
  };

  it('sends correct payload to Aria /ask endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ recommendation: 'Program content here' }),
    });
    globalThis.fetch = mockFetch;

    await callAriaApi(baseParams);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://aria-dev-api.azurewebsites.net/ask');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });

    const body = JSON.parse(options.body);
    expect(body.user_id).toBe('42');
    expect(body.user_input).toBe('Create a sprint program');
    expect(body.system_prompt).toBe('You are Sprinthia');
    expect(body.conversation_history).toEqual([]);
  });

  it('returns recommendation when present', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ recommendation: 'Speed program content' }),
    });

    const result = await callAriaApi(baseParams);
    expect(result).toBe('Speed program content');
  });

  it('falls back to response field when recommendation is absent', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'Fallback program content' }),
    });

    const result = await callAriaApi(baseParams);
    expect(result).toBe('Fallback program content');
  });

  it('prefers recommendation over response when both are present', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        recommendation: 'Primary content',
        response: 'Fallback content',
      }),
    });

    const result = await callAriaApi(baseParams);
    expect(result).toBe('Primary content');
  });

  it('throws when Aria API returns non-ok status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    await expect(callAriaApi(baseParams)).rejects.toThrow('Aria API returned 500');
  });

  it('throws when Aria API returns 429 rate limit', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Too Many Requests',
    });

    await expect(callAriaApi(baseParams)).rejects.toThrow('Aria API returned 429');
  });

  it('throws when response has no content (no recommendation or response)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });

    await expect(callAriaApi(baseParams)).rejects.toThrow('No content generated from Aria API');
  });

  it('throws when response has empty string recommendation', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ recommendation: '', response: '' }),
    });

    await expect(callAriaApi(baseParams)).rejects.toThrow('No content generated from Aria API');
  });

  it('passes conversation_history when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ recommendation: 'Content' }),
    });
    globalThis.fetch = mockFetch;

    const history = [{ role: 'user', content: 'Hello' }];
    await callAriaApi({ ...baseParams, conversationHistory: history });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.conversation_history).toEqual(history);
  });

  it('throws when fetch itself fails (network error)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(callAriaApi(baseParams)).rejects.toThrow('Network error');
  });
});

// ─── Integration: generate program flow ─────────────────────────────

describe('generate program flow (integration)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('end-to-end: builds prompts, calls Aria, cleans response', async () => {
    // Simulate what the route handler does
    const mockAriaResponse = '```json\n{"recommendation": "## 12-Week Sprint Program\\n\\n### Block 1: Base Phase\\nWeek 1-4\\n\\n**Bibliography:**\\n1. Smith (2020)"}\n```';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ recommendation: mockAriaResponse }),
    });

    const params = {
      title: 'My Sprint Program',
      description: '100m focus',
      totalLengthWeeks: 12,
      blocks: 3,
      workoutsPerWeek: 5,
      gymWorkoutsPerWeek: 2,
      blockFocus: 'speed',
      aiPrompt: 'Focus on acceleration',
    };

    // Step 1: Build prompts
    const systemPrompt = buildGenerateSystemPrompt();
    const userPrompt = buildGenerateUserPrompt(params);

    expect(systemPrompt).toContain('Sprinthia');
    expect(userPrompt).toContain('My Sprint Program');
    expect(userPrompt).toContain('Focus on acceleration');

    // Step 2: Call Aria
    let content = await callAriaApi({
      ariaApiUrl: 'https://aria-dev-api.azurewebsites.net',
      userId: '1',
      userPrompt,
      systemPrompt,
    });

    expect(content).toBeTruthy();

    // Step 3: Clean
    content = cleanAIResponse(content, userPrompt);

    expect(content).not.toContain('```');
    expect(content).not.toContain('Bibliography');
    expect(content).toContain('12-Week Sprint Program');
    expect(content).toContain('Block 1');
  });
});

// ─── Integration: regenerate program flow ───────────────────────────

describe('regenerate program flow (integration)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('end-to-end: builds regen prompts, calls Aria, cleans response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        recommendation: '## New 8-Week Program\n\n### Block 1\nDifferent exercises here.',
      }),
    });

    const params = {
      title: 'Sprint Program v2',
      description: 'Regenerated',
      totalLengthWeeks: 8,
      blocks: 2,
      workoutsPerWeek: 4,
      gymWorkoutsPerWeek: 2,
      blockFocus: 'speed-endurance',
      aiPrompt: 'More hills',
      previousContent: '## Old Program\nWeek 1: Jogs',
    };

    const systemPrompt = buildRegenerateSystemPrompt();
    const userPrompt = buildRegenerateUserPrompt(params);

    expect(systemPrompt).toContain('regenerating');
    expect(userPrompt).toContain('DO NOT COPY');
    expect(userPrompt).toContain('## Old Program');

    let content = await callAriaApi({
      ariaApiUrl: 'https://aria-dev-api.azurewebsites.net',
      userId: '2',
      userPrompt,
      systemPrompt,
    });

    content = cleanAIResponse(content, userPrompt);

    expect(content).toContain('New 8-Week Program');
    expect(content).toContain('Different exercises');
  });

  it('handles Aria error gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    });

    const systemPrompt = buildRegenerateSystemPrompt();
    const userPrompt = buildRegenerateUserPrompt({
      title: 'Test',
      description: '',
      totalLengthWeeks: 4,
      blocks: 1,
      workoutsPerWeek: 3,
      gymWorkoutsPerWeek: 1,
      blockFocus: 'mixed',
    });

    await expect(
      callAriaApi({
        ariaApiUrl: 'https://aria-dev-api.azurewebsites.net',
        userId: '3',
        userPrompt,
        systemPrompt,
      })
    ).rejects.toThrow('Aria API returned 503');
  });
});
