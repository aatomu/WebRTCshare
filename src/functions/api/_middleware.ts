interface Env {
  appID: string;
  token: string;
  turnID: string;
  turnToken: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const request: Request = context.request;
  const REQUEST_PATH = new URL(request.url).pathname.split("/");
  //const REQUEST_EntryPoint = REQUEST_PATH[1];
  const REQUEST_SITE = REQUEST_PATH[2];
  const REQUEST_API = REQUEST_PATH[3];
  console.log(`PATH: ${REQUEST_PATH}`)
  console.log(`ID: ${context.env.appID}`);
  return new Response("404 Not Found");
};
