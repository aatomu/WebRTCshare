// index.ts
interface Env {
	appID: string;
	token: string;
	turnID: string;
	turnToken: string;
	KV: KVNamespace;
	ASSETS: Fetcher;
}

type SessionDescription = {
	sdp: string;
	type: 'answer' | 'offer';
};

type TracksRequest = {
	sessionDescription: SessionDescription;
	tracks: TrackObject[];
};
type TrackObject = {
	type: 'local' | 'remote';
	mid: string;
	sessionID: string;
	trackName: string;
};

type Session = {
	tracks: string[];
	sourceID: string;
};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const REQUEST_PATH = new URL(request.url).pathname.split('/');
		if (REQUEST_PATH[1] != 'api') return new Response('404 Not Found', { status: 404 });
		const REQUEST_API = REQUEST_PATH[2];
		const query = new URLSearchParams(new URL(request.url).searchParams);
		console.log(`PATH: ${REQUEST_PATH}`);

		const API_BASE = `https://rtc.live.cloudflare.com/v1/apps/${env.appID}`;
		const API_HEADER = {
			Authorization: `Bearer ${env.token}`,
		};

		switch (REQUEST_API) {
			case 'new_session': {
				if (request.method != 'GET') return new Response('400 Bad Request', { status: 400 });

				return fetch(`${API_BASE}/sessions/new`, {
					method: 'POST',
					headers: API_HEADER,
				});
			}
			case 'new_tracks': {
				if (request.method != 'POST') return new Response('400 Bad Request', { status: 400 });

				const sessionID = query.get('session');
				const customID = query.get('id');
				if (!sessionID || !customID) return new Response('400 Bad Request', { status: 400 });

				// Cache session
				const data: TracksRequest = await request.clone().json();
				const tracks = data.tracks.map((track) => track.trackName);
				const session: Session = {
					tracks: tracks,
					sourceID: sessionID,
				};
				env.KV.put(customID, JSON.stringify(session), {
					expirationTtl: 600,
				});

				return fetch(`${API_BASE}/sessions/${sessionID}/tracks/new`, {
					method: 'POST',
					headers: API_HEADER,
					body: request.body,
				});
			}
			case 'pull_tracks': {
				if (request.method != 'GET') return new Response('400 Bad Request', { status: 400 });

				const sessionID = query.get('session');
				const customID = query.get('id');
				if (!sessionID || !customID) return new Response('400 Bad Request', { status: 400 });

				// Cache tracks
				let cache = await env.KV.get(customID);
				if (!cache) {
					return new Response('404 Not Found', { status: 404 });
				}
				const session: Session = JSON.parse(cache);
				const pullTracks = session.tracks.map((track) => ({
					location: 'remote',
					trackName: track,
					sessionId: session.sourceID,
				}));

				return fetch(`${API_BASE}/sessions/${sessionID}/tracks/new`, {
					method: 'POST',
					headers: API_HEADER,
					body: JSON.stringify({
						tracks: pullTracks,
					}),
				});
			}
			case 'renegotiate_session': {
				if (request.method != 'PUT') return new Response('400 Bad Request', { status: 400 });
				const SESSION_ID = query.get('id');
				return fetch(`${API_BASE}/sessions/${SESSION_ID}/renegotiate`, {
					method: 'PUT',
					headers: API_HEADER,
					body: request.body,
				});
			}
			case 'get_turn_server': {
				if (request.method != 'GET') return new Response('400 Bad Request', { status: 400 });
				return fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.turnID}/credentials/generate`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${env.turnToken}`,
						'Content-Type': `application/json`,
					},
					body: JSON.stringify({
						ttl: 86400,
					}),
				});
			}
		}
		return new Response('404 Not Found');
	},
};
