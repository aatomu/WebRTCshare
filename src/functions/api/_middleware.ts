interface Env {
  appID: string;
  token: string;
  turnID: string;
  turnToken: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const REQUEST_PATH = new URL(request.url).pathname.split("/");
    //const REQUEST_EntryPoint = REQUEST_PATH[1];
    const REQUEST_SITE = REQUEST_PATH[2];
    const REQUEST_API = REQUEST_PATH[3];
    console.log(env, REQUEST_PATH);
    return new Response("404 Not Found");
  },
};
