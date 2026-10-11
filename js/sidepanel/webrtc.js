import { appState, webrtcSystem } from "./state.js";
import { elements } from "./elements.js";

// ================== WEBRTC VIDEO CHAT ==================
  
  export function initWebRTC() {
  if (!elements.startButton || !elements.hangupButton) return;
  
  // Start button
  elements.startButton.onclick = async () => {
   try {
     updateVideoStatus("Starting camera...");
     
     webrtcSystem.localStream = await navigator.mediaDevices.getUserMedia({
       video: true,
       audio: true
     });
     
     if (elements.localVideo) {
       elements.localVideo.srcObject = webrtcSystem.localStream;
       elements.localVideo.style.transform = "scaleX(-1)";
     }
     
     elements.startButton.disabled = true;
     elements.hangupButton.disabled = false;
     
     updateVideoStatus("Call started");
     updateMediaButtons();
     
     if (appState.currentVideoRoom) {
       await setupWebRTCSignaling(appState.currentVideoRoom);
     }
     
   } catch (error) {
     console.error("Camera startup error:", error);
     
     if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
       console.log("🚫 Media permission denied, redirecting to extension settings...");
       updateVideoStatus("Media access denied - Opening extension settings...");
       
       const extensionId = chrome.runtime.id;
       const settingsUrl = `chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2F${extensionId}`;
       
       chrome.tabs.create({ url: settingsUrl });
       
       setTimeout(() => {
         updateVideoStatus("Extension settings opened. Please allow camera and microphone access, then try again.");
       }, 1000);
       
     } else if (error.name === 'NotFoundError') {
       updateVideoStatus("Camera/microphone not found");
     } else if (error.name === 'NotReadableError') {
       updateVideoStatus("Camera/microphone already in use");
     } else {
       updateVideoStatus("Camera/microphone access error: " + error.message);
     }
     
     elements.startButton.disabled = false;
   }
  };
  
  // Hangup button
  elements.hangupButton.onclick = () => {
   stopWebRTC();
  };
  
  // Camera toggle
  if (elements.cameraToggle) {
   elements.cameraToggle.onclick = () => {
     if (webrtcSystem.localStream) {
       const videoTrack = webrtcSystem.localStream.getVideoTracks()[0];
       if (videoTrack) {
         webrtcSystem.isCameraOn = !webrtcSystem.isCameraOn;
         videoTrack.enabled = webrtcSystem.isCameraOn;
         updateMediaButtons();
         updateVideoStatus(webrtcSystem.isCameraOn ? "Camera on" : "Camera off");
       }
     }
   };
  }
  
  // Microphone toggle
  if (elements.micToggle) {
   elements.micToggle.onclick = () => {
     if (webrtcSystem.localStream) {
       const audioTrack = webrtcSystem.localStream.getAudioTracks()[0];
       if (audioTrack) {
         webrtcSystem.isMicOn = !webrtcSystem.isMicOn;
         audioTrack.enabled = webrtcSystem.isMicOn;
         updateMediaButtons();
         updateVideoStatus(webrtcSystem.isMicOn ? "Microphone on" : "Microphone off");
       }
     }
   };
  }
  
  console.log("📹 WebRTC initialized with settings redirect");
  }
  
  export async function setupWebRTCSignaling(roomId) {
  try {
   webrtcSystem.roomRef = appState.database.ref(`webrtcRooms/${roomId}`);
   
   const roomSnapshot = await webrtcSystem.roomRef.once('value');
   
   if (!roomSnapshot.exists()) {
     await createWebRTCRoom();
   } else {
     await joinWebRTCRoom();
   }
   
  } catch (error) {
   console.error("WebRTC signaling error:", error);
   updateVideoStatus("Connection error: " + error.message);
  }
  }
  
  export async function createWebRTCRoom() {
  try {
   updateVideoStatus("Creating room...");
   
   webrtcSystem.peerConnection = new RTCPeerConnection(webrtcSystem.servers);
   setupPeerConnectionEvents();
   
   if (webrtcSystem.localStream) {
     webrtcSystem.localStream.getTracks().forEach(track => {
       webrtcSystem.peerConnection.addTrack(track, webrtcSystem.localStream);
     });
   }
   
   collectICECandidates('caller', 'callee');
   
   const offer = await webrtcSystem.peerConnection.createOffer({
     offerToReceiveAudio: true,
     offerToReceiveVideo: true
   });
   await webrtcSystem.peerConnection.setLocalDescription(offer);
   
   await webrtcSystem.roomRef.set({
     offer: {
       type: offer.type,
       sdp: offer.sdp
     },
     created: Date.now()
   });
   
   webrtcSystem.roomRef.on('value', async (snapshot) => {
     const data = snapshot.val();
     if (data?.answer && webrtcSystem.peerConnection.signalingState === 'have-local-offer') {
       try {
         const answer = new RTCSessionDescription(data.answer);
         await webrtcSystem.peerConnection.setRemoteDescription(answer);
         updateVideoStatus("Answer received, connecting...");
       } catch (error) {
         console.error("Answer processing error:", error);
         updateVideoStatus("Connection error");
       }
     }
   });
   
   updateVideoStatus("Waiting for participant...");
   
  } catch (error) {
   console.error("Room creation error:", error);
   updateVideoStatus("Room creation error: " + error.message);
  }
  }
  
  export async function joinWebRTCRoom() {
  try {
   updateVideoStatus("Joining room...");
   
   const roomSnapshot = await webrtcSystem.roomRef.once('value');
   const roomData = roomSnapshot.val();
   
   if (!roomData?.offer) {
     updateVideoStatus("Invalid room");
     return;
   }
   
   webrtcSystem.peerConnection = new RTCPeerConnection(webrtcSystem.servers);
   setupPeerConnectionEvents();
   
   if (webrtcSystem.localStream) {
     webrtcSystem.localStream.getTracks().forEach(track => {
       webrtcSystem.peerConnection.addTrack(track, webrtcSystem.localStream);
     });
   }
   
   collectICECandidates('callee', 'caller');
   
   const offer = new RTCSessionDescription(roomData.offer);
   await webrtcSystem.peerConnection.setRemoteDescription(offer);
   
   const answer = await webrtcSystem.peerConnection.createAnswer();
   await webrtcSystem.peerConnection.setLocalDescription(answer);
   
   await webrtcSystem.roomRef.update({
     answer: {
       type: answer.type,
       sdp: answer.sdp
     }
   });
   
   updateVideoStatus("Connecting...");
   
  } catch (error) {
   console.error("Room join error:", error);
   updateVideoStatus("Room join error: " + error.message);
  }
  }
  
  export function setupPeerConnectionEvents() {
  if (!webrtcSystem.peerConnection) return;
  
  webrtcSystem.remoteStream = new MediaStream();
  if (elements.remoteVideo) {
   elements.remoteVideo.srcObject = webrtcSystem.remoteStream;
   elements.remoteVideo.style.transform = "scaleX(-1)";
  }
  
  webrtcSystem.peerConnection.ontrack = (event) => {
   console.log("Remote track received");
   event.streams[0].getTracks().forEach(track => {
     webrtcSystem.remoteStream.addTrack(track);
   });
  };
  
  webrtcSystem.peerConnection.onconnectionstatechange = () => {
   const state = webrtcSystem.peerConnection.connectionState;
   console.log("Connection state:", state);
   
   switch (state) {
     case 'connected':
       updateVideoStatus("Connected! Call is active.");
       break;
     case 'disconnected':
       updateVideoStatus("Connection lost");
       break;
     case 'failed':
       updateVideoStatus("Connection failed");
       break;
   }
  };
  }
  
  export function collectICECandidates(localName, remoteName) {
  const localCandidatesRef = webrtcSystem.roomRef.child(`${localName}Candidates`);
  const remoteCandidatesRef = webrtcSystem.roomRef.child(`${remoteName}Candidates`);
  
  webrtcSystem.peerConnection.onicecandidate = (event) => {
   if (event.candidate) {
     console.log(`📡 ${localName} ICE candidate sending`);
     localCandidatesRef.push(event.candidate.toJSON()).catch(error => {
       console.error("ICE candidate sending error:", error);
     });
   }
  };
  
  remoteCandidatesRef.on('child_added', async (snapshot) => {
   const candidateData = snapshot.val();
   console.log(`📡 ${remoteName} ICE candidate received`);
   
   try {
     const candidate = new RTCIceCandidate(candidateData);
     await webrtcSystem.peerConnection.addIceCandidate(candidate);
     console.log(`✅ ${remoteName} ICE candidate added`);
   } catch (error) {
     console.error(`❌ ${remoteName} ICE candidate add error:`, error);
   }
  });
  }
  
  export function updateMediaButtons() {
  if (elements.cameraToggle) {
   const cameraOn = elements.cameraToggle.querySelector('.camera-on');
   const cameraOff = elements.cameraToggle.querySelector('.camera-off');
   
   if (cameraOn && cameraOff) {
     if (webrtcSystem.isCameraOn) {
       cameraOn.classList.remove('hidden');
       cameraOff.classList.add('hidden');
       elements.cameraToggle.classList.add('active');
       elements.cameraToggle.classList.remove('inactive');
     } else {
       cameraOn.classList.add('hidden');
       cameraOff.classList.remove('hidden');
       elements.cameraToggle.classList.remove('active');
       elements.cameraToggle.classList.add('inactive');
     }
   }
  }
  
  if (elements.micToggle) {
   const micOn = elements.micToggle.querySelector('.mic-on');
   const micOff = elements.micToggle.querySelector('.mic-off');
   
   if (micOn && micOff) {
     if (webrtcSystem.isMicOn) {
       micOn.classList.remove('hidden');
       micOff.classList.add('hidden');
       elements.micToggle.classList.add('active');
       elements.micToggle.classList.remove('inactive');
     } else {
       micOn.classList.add('hidden');
       micOff.classList.remove('hidden');
       elements.micToggle.classList.remove('active');
       elements.micToggle.classList.add('inactive');
     }
   }
  }
  }
  
  export function updateVideoStatus(message) {
  if (elements.videoStatus) {
   elements.videoStatus.textContent = message;
  }
  console.log("📹", message);
  }
  
  export function stopWebRTC() {
  if (webrtcSystem.localStream) {
   webrtcSystem.localStream.getTracks().forEach(track => track.stop());
   webrtcSystem.localStream = null;
  }
  
  if (webrtcSystem.remoteStream) {
   webrtcSystem.remoteStream.getTracks().forEach(track => track.stop());
   webrtcSystem.remoteStream = null;
  }
  
  if (webrtcSystem.peerConnection) {
   webrtcSystem.peerConnection.close();
   webrtcSystem.peerConnection = null;
  }
  
  if (webrtcSystem.roomRef) {
   webrtcSystem.roomRef.off();
   webrtcSystem.roomRef = null;
  }
  
  if (elements.localVideo) elements.localVideo.srcObject = null;
  if (elements.remoteVideo) elements.remoteVideo.srcObject = null;
  
  if (elements.startButton) elements.startButton.disabled = false;
  if (elements.hangupButton) elements.hangupButton.disabled = true;
  
  webrtcSystem.isCameraOn = true;
  webrtcSystem.isMicOn = true;
  
  updateVideoStatus("Call ended");
  console.log("🛑 WebRTC stopped");
  }
