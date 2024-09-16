interface Env {
  appID: string;
  token: string;
  turnID: string;
  turnToken: string;
  KV: KVNamespace;
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

export const onRequest: PagesFunction<Env> = async (context) => {
  const request: Request = context.request;
  const REQUEST_PATH = new URL(request.url).pathname.split("/");
  const REQUEST_API = REQUEST_PATH[2];
  const query = new URLSearchParams(new URL(request.url).searchParams);
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
      const SESSION_ID = query.get("id");
      // Cache tracks
      const data: TracksRequest = await request.clone().json();
      const tracks = data.tracks.map((track) => track.trackName);
      context.env.KV.put(SESSION_ID, JSON.stringify(tracks), {
        expirationTtl: 600,
      });

      return fetch(`${API_BASE}/sessions/${SESSION_ID}/tracks/new`, {
        method: "POST",
        headers: API_HEADER,
        body: request.body,
      });
    }
    case "pull_tracks": {
      if (request.method != "GET") return new Response("400 Bad Request", { status: 400 });
      // Cache tracks
      const SESSION_ID = query.get("id");
      const SOURCE_ID = query.get("source");
      let cache = await context.env.KV.get(SOURCE_ID);
      const tracks = JSON.parse(cache ? cache : "[]");
      const pullTracks = tracks.map((track) => ({
        location: "remote",
        trackName: track,
        sessionId: SOURCE_ID,
      }));

      return fetch(`${API_BASE}/sessions/${SESSION_ID}/tracks/new`, {
        method: "POST",
        headers: API_HEADER,
        body: JSON.stringify({
          tracks: pullTracks,
        }),
      });
    }
    case "renegotiate_session": {
      if (request.method != "PUT") return new Response("400 Bad Request", { status: 400 });
      const SESSION_ID = query.get("id");
      return fetch(`${API_BASE}/sessions/${SESSION_ID}/renegotiate`, {
        method: "PUT",
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
