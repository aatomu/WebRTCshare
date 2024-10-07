async function newPullSession(customID) {
	// Create video element
	setStatus("Create preview window")
	const video = document.createElement("video")
	video.muted = true
	video.autoplay = true
	document.getElementById("preview").appendChild(video)
	video.addEventListener("click", (e) => {
		const target = e.target
		target.muted = !target.muted
		if (!target.muted) {
			target.classList.add("sound")
		} else {
			target.classList.remove("sound")
		}
	})

	// "Create a New Session" request
	setStatus("Create session")
	const sessionID = await newSession()
	// Create "local WevRTC" connection
	setStatus("Connecting session")
	const connection = await createPeerConnection()
	// Pull tracks request
	setStatus("Sending pull tracks")
	const pullResponse = await pullTrack(customID, sessionID)
	if (!pullResponse) {
		setStatus("Invalid session")
		return
	}
	// Track resolve check
	const resolveTracks = Promise.all(
		pullResponse.tracks.map(({ mid }) =>
			new Promise((resolve, reject) => {
				const timeout = setTimeout(() => {
					setStatus("Pull tracks timed out")
					reject()
				}, 5000)
				function checkTrack({ transceiver, track }) {
					if (transceiver.mid !== mid) return
					connection.removeEventListener("track", checkTrack)
					clearTimeout(timeout)
					resolve(track)
				}
				connection.addEventListener("track", checkTrack)
			})
		)
	)
	// Renegotiation WebRTC
	if (pullResponse.requiresImmediateRenegotiation) {
		setStatus("Renegotiation connection")
		await connection.setRemoteDescription(pullResponse.sessionDescription)
		// Create an answer
		const remoteAnswer = await connection.createAnswer()
		// And set it as local description
		await connection.setLocalDescription(remoteAnswer)
		// Send our answer back to the Calls API
		setStatus("Sending renegotiation config")
		const renegotiateResponse = await renegotiateSession(sessionID, remoteAnswer)
		if (renegotiateResponse.errorCode) {
			setStatus("Error: failed send renegotiation config")
			throw new Error(renegotiateResponse.errorDescription)
		}
	}
	// Wait pull Tracks
	setStatus("Wait pull tracks")
	const pulledTracks = await resolveTracks;
	// Remote Preview
	setStatus("Create remote preview")
	const stream = new MediaStream();
	video.srcObject = stream
	pulledTracks.forEach((t) => stream.addTrack(t));

	setStatus("Complete!")

	// Return peerConnection
	return { rtc: connection }
}
