async function newPushSession(customID) {

	// Get media stream
	setStatus("Wait user select media")
	const media = await navigator.mediaDevices.getDisplayMedia({
		audio: {
			autoGainControl: true,
			channelCount: 1,
			echoCancellation: false,
			noiseSuppression: false,
			sampleRate: 24000,
		},
		video: {
			height: 480,
			width: 854,
			frameRate: 30,
			suppressLocalAudioPlayback: false,
		},
		systemAudio: "include",
		surfaceSwitching: "include",
		monitorTypeSurfaces: "include",
	})
	// Local preview
	setStatus("Create local preview")
	const preview = document.getElementById("preview")
	preview.srcObject = media
	// "Create a New Session" request
	setStatus("Create session")
	const sessionID = await newSession()
	// Create "local WevRTC" connection
	setStatus("Connecting session")
	const connection = await createPeerConnection()
	// Set transceiver
	setStatus("Setting transceivers")
	const transceivers = media.getTracks().map((track) =>
		connection.addTransceiver(track, {
			direction: "sendonly",
		}),
	);
	// Create "local WevRTC" offer
	setStatus("Sending transfer config")
	const localOffer = await connection.createOffer()
	await connection.setLocalDescription(localOffer)
	// Push track request
	setStatus("Sending push tracks")
	const pushTracks = await newTrack(customID, sessionID, {
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
	setStatus("Waiting connect")
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
			setStatus("Success: share URL")
			const accessURL = new URL(window.location.href)
			accessURL.searchParams.set("id", customID)
			document.getElementById("shareURL").value = accessURL.href
		})
		.catch((e) => {
			console.log("Error iceConneced:", e)
			setStatus("Connection timed out!")
		})

	// Return connection
	return { rtc: connection }
}
