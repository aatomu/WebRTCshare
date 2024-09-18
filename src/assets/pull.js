async function newPullSession(sourceID) {
  const stat = document.getElementById("stat")
  // "Create a New Session" request
  stat.innerText = "Create session"
  const sessionID = await newSession()
  // Create "local WevRTC" connection
  stat.innerText = "Connecting session"
  const connection = await createPeerConnection()
  // Setting data channel
  const dataChannel = connection.createDataChannel("channel",{ordered:true,negotiated:true,id:0})
  dataChannel.addEventListener("open",(event)=>{console.log("Channel Open:",event)})
  dataChannel.addEventListener("message",(event)=>{console.log("Channel message:",event)})
  dataChannel.addEventListener("close",(event)=>{console.log("Channel Close:",event)})
  // Pull tracks request
  stat.innerText = "Sending pull tracks"
  const pullResponse = await pullTrack(sessionID, sourceID)
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
  return { rtc: connection, channel: dataChannel }
}