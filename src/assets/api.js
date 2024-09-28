const API_SERVER = "https://web-share.pages.dev/api"

async function createPeerConnection() {
  const turnConfig = await fetch(`${API_SERVER}/get_turn_server`).then(res => { return res.json() })

  const RTCconfig = {
    iceServers: [
      {
        urls: "stun:stun.cloudflare.com:3478",
      },
      turnConfig.iceServers
    ],
    bundlePolicy: "max-bundle"
  }
  const peerConnection = new RTCPeerConnection(RTCconfig);
  console.log(`New PeerConn Config:`, RTCconfig)
  console.log(`New PeerConn:`, peerConnection)
  peerConnection.addEventListener("icecandidateerror", (e) => {
    console.log("Error PeerConn", e)
  })
  return peerConnection;
}

async function newSession() {
  const sessionResponse = await fetch(`${API_SERVER}/new_session`).then((res) => res.json());
  console.log(`New Session:`, sessionResponse)
  return sessionResponse.sessionId;
}

async function newTrack(sessionID, body) {
  const trackResponse = await fetch(`${API_SERVER}/new_tracks?id=${sessionID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    },
  ).then((res) => res.json());
  console.log(`New Tracks:`, trackResponse)
  return trackResponse;
}

async function pullTrack(sessionID, sourceID) {
  const trackResponse = await fetch(`${API_SERVER}/pull_tracks?id=${sessionID}&source=${sourceID}`)
    .then((res) => {
      if (!res.ok) {
        console.log(`Pull Tracks Error:`, e)
        return null
      }
      return res.json()
    })
  console.log(`Pull Tracks:`, trackResponse)
  return trackResponse;
}

async function renegotiateSession(sessionID, remoteAnswer) {
  const renegotiateResponse = await fetch(`${API_SERVER}/renegotiate_session?id=${sessionID}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionDescription: {
          sdp: remoteAnswer.sdp,
          type: "answer",
        },
      }),
    },
  ).then((res) => res.json())
  console.log(`Renegotiate Session:`, renegotiateResponse)
  return renegotiateResponse;
}