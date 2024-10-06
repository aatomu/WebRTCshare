// index.ts
export interface Env {
  TOKEN: string;
  PUBLIC_KEY: string;
  AI: Ai;
  ASSETS: Fetcher;
}

const embedError = 0xff0000;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) {
      return new Response(env.PUBLIC_KEY)
    }
    return env.ASSETS.fetch(request);
  },
};
