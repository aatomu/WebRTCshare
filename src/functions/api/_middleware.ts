interface Env {
  appID: string;
  token: string;
  turnID: string;
  turnToken: string;
}

type SessionDescription = {
  sdp: string;
  type: "answer" | "offer";
};

type TracksRequest = {
  sessionDescription: SessionDescription;
  tracks: TrackObject[];
};
type TrackObject = {
  type: "local" | "remote";
  mid: string;
  sessionID: string;
  trackName: string;
};

type NewSessionResponse = {
  sessionDescription: SessionDescription;
  sessionId: string;
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const request: Request = context.request;
  const REQUEST_PATH = new URL(request.url).pathname.split("/");
  const REQUEST_API = REQUEST_PATH[2];
  const SESSION_ID = REQUEST_PATH[3];
  console.log(`PATH: ${REQUEST_PATH}`);
  console.log(`ID: ${context.env.appID}`);

  const API_BASE = `https://rtc.live.cloudflare.com/v1/apps/${context.env.appID}`;
  const API_HEADER = {
    Authorization: `Bearer ${context.env.token}`,
  };

  switch (REQUEST_API) {
    case "new_session": {
      if (request.method != "GET") return new Response("400 Bad Request", { status: 400 });
      return fetch(`${API_BASE}/sessions/new`, {
        method: "POST",
        headers: API_HEADER,
      });
    }
    case "new_tracks": {
      if (request.method != "POST") return new Response("400 Bad Request", { status: 400 });
      // Cache tracks
      const data: TracksRequest = await request.clone().json();
      const tracks = data.tracks.map((track) => track.trackName);
      await caches.default.put(new Request(`https://example.com/cache/${SESSION_ID}`), new Response(JSON.stringify(tracks)));

      return fetch(`${API_BASE}/sessions/${SESSION_ID}/tracks/new`, {
        method: "POST",
        headers: API_HEADER,
        body: request.body,
      });
    }
    case "get_turn_server": {
      if (request.method != "GET") return new Response("400 Bad Request", { status: 400 });
      return fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${context.env.turnID}/credentials/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${context.env.turnToken}`,
          "Content-Type": `application/json`,
        },
        body: JSON.stringify({
          ttl: 86400,
        }),
      });
    }
  }
  return new Response("404 Not Found");
};
