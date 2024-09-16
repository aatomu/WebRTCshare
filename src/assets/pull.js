async function newPullSession(sourceID) {
      // "Create a New Session" request
      remoteStatus.innerText = "Create session"
      const sessionID = await newSession()
      // Create "local WevRTC" connection
      remoteStatus.innerText = "Connecting session"
      const connection = await createPeerConnection()
      // Pull tracks request
      remoteStatus.innerText = "Sending pull tracks"
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
        remoteStatus.innerText = "Renegotiation connection"
        await connection.setRemoteDescription(pullResponse.sessionDescription)
        // Create an answer
        const remoteAnswer = await connection.createAnswer()
        // And set it as local description
        await connection.setLocalDescription(remoteAnswer)
        // Send our answer back to the Calls API
        remoteStatus.innerText = "Sending renegotiation config"
        const renegotiateResponse = await renegotiateSession(sessionID, remoteAnswer)
        if (renegotiateResponse.errorCode) {
          remoteStatus.innerText = "Error: failed send renegotiation config"
          throw new Error(renegotiateResponse.errorDescription)
        }
      }
      // Wait pull Tracks
      remoteStatus.innerText = "Wait pull tracks"
      const pulledTracks = await resolveTracks;
      // Remote Preview
      remoteStatus.innerText = "Create remote preview"
      const stream = new MediaStream();
      document.getElementById("remote").srcObject = stream
      document.getElementById("remote").play()
      pulledTracks.forEach((t) => stream.addTrack(t));
  
      remoteStatus.innerText = "Complete!"
}