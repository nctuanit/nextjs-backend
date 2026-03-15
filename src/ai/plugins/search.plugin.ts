import type { AIPlugin } from './plugin.interface';
import type { ToolRegistry } from '../tool.registry';

export interface SearchPluginOptions {
  /** Tavily API key (https://tavily.com) */
  apiKey: string;
  /** Max search results to return (default: 5) */
  maxResults?: number;
  /** Search depth — 'basic' (fast) or 'advanced' (comprehensive) */
  searchDepth?: 'basic' | 'advanced';
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

/**
 * Web Search Plugin — gives agents real-time web search via Tavily API.
 * Registers `web_search` and `get_webpage` tools.
 */
export class SearchPlugin implements AIPlugin {
  readonly name = 'search';
  private readonly apiKey: string;
  private readonly maxResults: number;
  private readonly searchDepth: 'basic' | 'advanced';

  constructor(options: SearchPluginOptions) {
    this.apiKey = options.apiKey;
    this.maxResults = options.maxResults ?? 5;
    this.searchDepth = options.searchDepth ?? 'basic';
  }

  register(registry: ToolRegistry): void {
    const self = this;

    registry.registerTool({
      name: 'web_search',
      description: 'Search the web for current information, news, and facts',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' },
        },
        required: ['query'],
      },
      instance: self,
      handler: async (...args: unknown[]) => {
        const query = args[0] as string;
        return self.search(query);
      },
    });

    registry.registerTool({
      name: 'get_webpage',
      description: 'Fetch and read the content of a specific webpage URL',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL to fetch' },
        },
        required: ['url'],
      },
      instance: self,
      handler: async (...args: unknown[]) => {
        const url = args[0] as string;
        return self.getWebpage(url);
      },
    });
  }

  private async search(query: string): Promise<SearchResult[]> {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        query,
        max_results: this.maxResults,
        search_depth: this.searchDepth,
        include_answer: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Search API error (${response.status}): ${await response.text()}`);
    }

    const data = (await response.json()) as {
      results: Array<{ title: string; url: string; content: string; score: number }>;
    };
    return data.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    }));
  }

  private async getWebpage(url: string): Promise<{ url: string; content: string }> {
    const response = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ urls: [url] }),
    });

    if (!response.ok) {
      throw new Error(`Extract API error (${response.status}): ${await response.text()}`);
    }

    const data = (await response.json()) as {
      results: Array<{ url: string; raw_content: string }>;
    };
    const result = data.results[0];
    return { url: result?.url ?? url, content: result?.raw_content ?? '' };
  }
}
