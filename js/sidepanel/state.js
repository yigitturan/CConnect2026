

// ================== GLOBAL STATE ==================
  
  export let appState = {
  currentUser: "",
  currentUserId: "",
  currentVideoRoom: "",
  currentChatRoom: "",
  database: null,
  initialized: false
  };
  
  // Email verification state
  export let emailVerificationState = {
  pendingEmail: "",
  verificationCode: "",
  codeExpiresAt: 0,
  isVerifying: false,
  timer: null,
  emailSent: false
  };
  
  // Shared note system
  export let sharedNoteSystem = {
  active: false,
  roomRef: null,
  listener: null,
  updateTimer: null,
  lastContent: "",
  isUpdating: false
  };
  
  // Chat system
  export let chatSystem = {
  active: false,
  messagesRef: null,
  listener: null
  };
  
  // WebRTC system
  export let webrtcSystem = {
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  roomRef: null,
  isCameraOn: true,
  isMicOn: true,
  servers: {
    iceServers: [
      { 
        urls: [
          'stun:stun1.l.google.com:19302', 
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302'
        ] 
      },
      {
        urls: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com'
      }
    ],
    iceCandidatePoolSize: 10
  }
  };
