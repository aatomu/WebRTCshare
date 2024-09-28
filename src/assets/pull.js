async function newPullSession(sourceID) {
  const stat = document.getElementById("stat")
  // "Create a New Session" request
  stat.innerText = "Create session"
  const sessionID = await newSession()
  // Create "local WevRTC" connection
  stat.innerText = "Connecting session"
  const connection = await createPeerConnection()
  // Pull tracks request
  stat.innerText = "Sending pull tracks"
  const pullResponse = await pullTrack(sessionID, sourceID)
  if (!pullResponse) {
    stat.innerText = "Invalid session"
    return
  }
  // Track resolve check
  const resolveTracks = Promise.all(
    pullResponse.tracks.map(({ mid }) =>
      new Promise((resolve, reject) => {
        setTimeout(reject, 5000)
        function checkTrack({ transceiver, track }) {
          if (transceiver.mid !== mid) return
          connection.removeEventListener("track", checkTrack)
          resolve(track)
        }
        connection.addEventListener("track", checkTrack)
      })
    )
  )
  // Renegotiation WebRTC
  if (pullResponse.requiresImmediateRenegotiation) {
    stat.innerText = "Renegotiation connection"
    await connection.setRemoteDescription(pullResponse.sessionDescription)
    // Create an answer
    const remoteAnswer = await connection.createAnswer()
    // And set it as local description
    await connection.setLocalDescription(remoteAnswer)
    // Send our answer back to the Calls API
    stat.innerText = "Sending renegotiation config"
    const renegotiateResponse = await renegotiateSession(sessionID, remoteAnswer)
    if (renegotiateResponse.errorCode) {
      stat.innerText = "Error: failed send renegotiation config"
      throw new Error(renegotiateResponse.errorDescription)
    }
  }
  // Wait pull Tracks
  stat.innerText = "Wait pull tracks"
  const pulledTracks = await resolveTracks;
  // Remote Preview
  stat.innerText = "Create remote preview"
  const stream = new MediaStream();
  const preview = document.getElementById("preview")
  preview.srcObject = stream
  pulledTracks.forEach((t) => stream.addTrack(t));

  stat.innerText = "Complete!"

  // Return peerConnection
  return { rtc: connection }
}