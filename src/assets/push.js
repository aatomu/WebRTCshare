async function newPushSession() {
  const stat = document.getElementById("stat")
  // Get media stream
  stat.innerText = "Wait user select media"
  const media = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: true
  })
  // Local preview
  stat.innerText = "Create local preview"
  const preview = document.getElementById("preview")
  preview.srcObject = media
  preview.play()
  preview.setAttribute("muted", true)
  // "Create a New Session" request
  stat.innerText = "Create session"
  const sessionID = await newSession()
  // Create "local WevRTC" connection
  stat.innerText = "Connecting session"
  const connection = await createPeerConnection()
  // Set transceiver
  stat.innerText = "Setting transceivers"
  const transceivers = media.getTracks().map((track) =>
    connection.addTransceiver(track, {
      direction: "sendonly",
    }),
  );
  // Create "local WevRTC" offer
  stat.innerText = "Sending transfer config"
  const localOffer = await connection.createOffer()
  await connection.setLocalDescription(localOffer)
  // Push track request
  stat.innerText = "Sending push tracks"
  const pushTracks = await newTrack(sessionID, {
    sessionDescription: {
      sdp: localOffer.sdp,
      type: "offer",
    },
    tracks: transceivers.map(({ mid, sender }) => ({
      location: "local",
      mid,
      trackName: sender.track?.id,
    })),
  })
  // Set "remote WebRTC" description
  await connection.setRemoteDescription(new RTCSessionDescription(pushTracks.sessionDescription))
  // Send Information
  stat.innerText = "Waiting connect"
  const iceConnected = new Promise((resolve, reject) => {
    // timeout after 5s
    setTimeout(reject, 5000);

    function checkState() {
      if (connection.iceConnectionState === "connected") {
        connection.removeEventListener("iceconnectionstatechange", checkState)
        resolve(null);
      }
    }
    connection.addEventListener("iceconnectionstatechange", checkState)
  })

  await iceConnected
    .then(() => {
      stat.innerText = "Success share \"sessionID\""
      const accessURL = new URL(window.location.href)
      accessURL.searchParams.set("id", sessionID)
      document.getElementById("shareURL").value = accessURL.href
    })
    .catch((e) => {
      console.log("Error iceConneced:", e)
      stat.innerText = "Connection timed out!"
    })
}