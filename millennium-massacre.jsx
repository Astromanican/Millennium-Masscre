import React, { useState, useEffect, useRef } from 'react';

// Simulated in-memory database for the artifact (replaces Firebase)
const inMemoryDB = {
  sessions: {}
};

const ROSTER = [
  { id: 'c1', name: 'The Final Girl', real_name: 'Sidney', emoji: '🔪', slogan: "I don't think we should go in there.", static_bio: "Sweet, studious, universally liked." },
  { id: 'c2', name: 'The Queen Bee', real_name: 'Regina', emoji: '👑', slogan: "Ugh, as if.", static_bio: "Rules the hallways with iron fist." },
  { id: 'c3', name: 'The Jock', real_name: 'Chad', emoji: '🏈', slogan: "Winning is everything.", static_bio: "Golden boy with golden arm." },
  { id: 'c4', name: 'The Horror Geek', real_name: 'Randy', emoji: '📼', slogan: "I've seen this movie.", static_bio: "Treats life like a film." },
  { id: 'c5', name: 'The Goth', real_name: 'Nancy', emoji: '🔮', slogan: "We are the weirdos.", static_bio: "Worried about planets." },
  { id: 'c6', name: 'The Reporter', real_name: 'Gale', emoji: '🎤', slogan: "Public has right to know!", static_bio: "Ruthless for headlines." },
  { id: 'c7', name: 'The Stoner', real_name: 'Slater', emoji: '🌿', slogan: "Was there a test?", static_bio: "Sees everything, no one notices." },
  { id: 'c8', name: 'The Rich Kid', real_name: 'Sebastian', emoji: '💎', slogan: "Know who my father is?", static_bio: "Wears money like armor." }
];

const DEFAULT_TIMELINE = [
  { id: 'evt_intro', time: '21:00', title: 'LOCK-IN BEGINS', description: 'Welcome guests', script: '' },
  { id: 'evt_mingle', time: '21:30', title: 'SOCIAL & SECRETS', description: 'Mingling starts', script: '' },
  { id: 'evt_body', time: '22:00', title: 'THE DISCOVERY', description: 'Body found', script: '' },
  { id: 'evt_investigation', time: '22:15', title: 'INVESTIGATION', description: 'Search for clues', script: '' },
  { id: 'evt_voting', time: '22:45', title: 'ACCUSATIONS', description: 'Final vote', script: '' },
  { id: 'evt_reveal', time: '23:00', title: 'THE REVEAL', description: 'Truth exposed', script: '' }
];

// Pre-generated story scenarios for demo (since we can't call external APIs)
const STORY_SCENARIOS = {
  default: {
    motive: "Revenge for a humiliating prank gone wrong at last year's pep rally",
    reconstruction: "The murder occurred in the AV room during the blackout. The killer lured the victim there with a fake note, then struck with the vintage bowling trophy from the display case.",
    intro_script: "Welcome, Class of '99, to what should be an unforgettable night... the Senior Lock-In! Little do you know, secrets buried since freshman year are about to surface. Someone here has been waiting for this moment. Waiting to settle a score. Tonight, the past catches up with ALL of you.",
    discovery_script: "*CRASH* The lights flicker back on and someone SCREAMS. In the AV room, a body lies motionless beneath the projection screen. The victim's eyes are open, frozen in surprise. A VHS tape labeled 'EVIDENCE' lies just out of reach of their outstretched hand. The doors lock automatically. No one is leaving until we find out who did this.",
    reveal_script: "You thought you could humiliate me and get away with it? You thought I'd just FORGET? Every day for three years, I planned this. Every smile was a lie. Every 'friendship' was strategy. And now? Now you know what it feels like to be trapped. To have nowhere to run. The killer removes their mask. Class of '99... school's out. Forever.",
    evidence_matrix: [
      { prop_name: "Bloody Bowling Trophy", type: "CRITICAL", clue: "Murder weapon from display case", associated_character: "The Jock" },
      { prop_name: "Torn Yearbook Page", type: "SUPPORTING", clue: "Shows defaced photo of victim", associated_character: "The Queen Bee" },
      { prop_name: "Prescription Bottle", type: "RED_HERRING", clue: "Anxiety medication - empty", associated_character: "The Goth" },
      { prop_name: "Pager with Cryptic Message", type: "CRITICAL", clue: "Message reads: 'AV ROOM 10PM - COME ALONE'", associated_character: "The Reporter" },
      { prop_name: "Cassette Recording", type: "SUPPORTING", clue: "Audio of heated argument", associated_character: "The Horror Geek" }
    ]
  }
};

export default function App() {
  const [mode, setMode] = useState('landing');
  const [activeTab, setActiveTab] = useState('TIMELINE');
  const [roomCode, setRoomCode] = useState('');
  const [myCharId, setMyCharId] = useState('');
  const [myName, setMyName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [rumorInput, setRumorInput] = useState('');
  const [plantInput, setPlantInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [rumorConfirmInput, setRumorConfirmInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedCharForLogin, setSelectedCharForLogin] = useState(null);
  const [revealResult, setRevealResult] = useState(null);
  
  const [gameState, setGameState] = useState({
    guestNames: {},
    characterPins: {},
    killerId: null,
    victimId: null,
    rumors: [],
    chatMessages: [],
    playerVotes: {},
    propStatus: {},
    pendingEvidence: [],
    timelineEvents: DEFAULT_TIMELINE,
    timelineStatus: {},
    bioCache: {},
    storyData: null,
    isLocked: false
  });

  // Sync with in-memory DB
  useEffect(() => {
    if (!roomCode) return;
    const interval = setInterval(() => {
      if (inMemoryDB.sessions[roomCode]?.gameState) {
        setGameState(prev => ({
          ...prev,
          ...inMemoryDB.sessions[roomCode].gameState
        }));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [roomCode]);

  const updateGameState = (updates) => {
    const newState = { ...gameState, ...updates };
    setGameState(newState);
    if (roomCode && inMemoryDB.sessions[roomCode]) {
      inMemoryDB.sessions[roomCode].gameState = newState;
    }
  };

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createHost = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    inMemoryDB.sessions[code] = {
      gameState: { ...gameState },
      hostConnected: true,
      created: Date.now()
    };
    setMode('host');
  };

  const joinGuest = () => {
    setShowJoinModal(true);
  };

  const confirmJoin = () => {
    if (!joinCodeInput) return;
    const code = joinCodeInput.toUpperCase();
    if (!inMemoryDB.sessions[code]) {
      inMemoryDB.sessions[code] = {
        gameState: { ...gameState },
        created: Date.now()
      };
    }
    setRoomCode(code);
    setShowJoinModal(false);
    setJoinCodeInput('');
    setMode('guest');
  };

  const loginAs = (charId) => {
    setSelectedCharForLogin(charId);
    setShowNameModal(true);
  };

  const confirmLogin = () => {
    if (!nameInput) return;
    setMyCharId(selectedCharForLogin);
    setMyName(nameInput);
    setIsLoggedIn(true);
    
    const newGuestNames = { ...gameState.guestNames, [selectedCharForLogin]: nameInput };
    updateGameState({ guestNames: newGuestNames });
    
    setShowNameModal(false);
    setNameInput('');
    setSelectedCharForLogin(null);
    setActiveTab('HOME');
  };

  const generateStory = async () => {
    setGenerating(true);
    
    const killerSelect = document.getElementById('killerSelect');
    const victimSelect = document.getElementById('victimSelect');
    const killerId = killerSelect?.value;
    const victimId = victimSelect?.value;
    
    if (!killerId || !victimId || killerId === victimId) {
      alert('Please select different characters for killer and victim');
      setGenerating(false);
      return;
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const killer = ROSTER.find(c => c.id === killerId);
    const victim = ROSTER.find(c => c.id === victimId);
    
    // Generate customized story based on killer/victim
    const storyData = {
      ...STORY_SCENARIOS.default,
      motive: `${killer.name} harbored a deep grudge against ${victim.name} since sophomore year when ${victim.name} exposed a secret that nearly destroyed ${killer.name}'s reputation.`,
      intro_script: `Welcome, Class of '99! Tonight's Senior Lock-In will be one for the history books. But beware... not everyone here is who they seem. ${victim.name} has secrets. ${killer.name} has plans. And someone won't make it to graduation.`,
      discovery_script: `*SCREAM* The lights surge back on. There, in the corner of the gymnasium, lies ${victim.name} - motionless. Their hand clutches a torn photo. Eyes frozen in terror. ${killer.name}'s alibi suddenly seems... suspicious. The doors are locked. The killer is among you.`,
      reveal_script: `"You really thought I'd let you get away with it, ${victim.name}? After everything you did to me?" ${killer.name} steps forward, the mask falling away. "Every. Single. Day. You made my life hell. Well, Class of '99... class is dismissed. PERMANENTLY."`
    };
    
    const pins = {};
    ROSTER.forEach(c => {
      pins[c.id] = Math.floor(1000 + Math.random() * 9000).toString();
    });
    
    const updatedTimeline = DEFAULT_TIMELINE.map(evt => {
      let script = evt.script;
      if (evt.id === 'evt_intro') script = storyData.intro_script;
      if (evt.id === 'evt_body') script = storyData.discovery_script;
      if (evt.id === 'evt_reveal') script = storyData.reveal_script;
      return { ...evt, script };
    });
    
    // Generate character bios
    const bioCache = {};
    ROSTER.forEach(char => {
      const isKiller = char.id === killerId;
      const isVictim = char.id === victimId;
      
      bioCache[char.id] = {
        objective: isKiller 
          ? `Deflect suspicion. Make sure no one discovers your crime. Frame someone else if necessary.`
          : isVictim 
            ? `You won't need this... you're already dead.`
            : `Find the killer before they strike again. Trust no one completely.`,
        secret: isKiller
          ? `You killed ${victim.name}. You had your reasons. Now you must cover your tracks.`
          : `You witnessed something suspicious the night of the murder, but revealing it would expose your own secret.`,
        alibi: isKiller
          ? `You claim you were in the library all night. But can anyone verify that?`
          : `You were seen near the crime scene, but you swear you saw nothing.`,
        notes: isKiller
          ? `Remember: stay calm, act shocked, and point fingers at others.`
          : `Pay attention to everyone's behavior. The killer will slip up eventually.`
      };
    });
    
    updateGameState({
      killerId,
      victimId,
      storyData,
      isLocked: true,
      characterPins: pins,
      timelineEvents: updatedTimeline,
      bioCache
    });
    
    setActiveTab('TIMELINE');
    setGenerating(false);
  };

  const timeAgo = (timestamp) => {
    const sec = Math.floor((Date.now() - timestamp) / 1000);
    if (sec < 60) return 'just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    return `${Math.floor(sec / 3600)}h ago`;
  };

  // Rumor Handlers
  const parseRumors = () => {
    if (!rumorInput.trim()) return;
    const lines = rumorInput.split('\n').filter(l => l.trim());
    let currentRumor = null;
    const newRumors = [];
    
    lines.forEach(line => {
      if (line.startsWith('Rumor:')) {
        if (currentRumor?.text) {
          newRumors.push({
            id: `r${Date.now()}_${Math.random()}`,
            text: currentRumor.text,
            significance: currentRumor.significance || '',
            inCirculation: false,
            isPublic: false,
            drawnBy: null,
            sharedWith: []
          });
        }
        currentRumor = { text: line.replace('Rumor:', '').trim(), significance: '' };
      } else if (line.startsWith('Significance:')) {
        if (currentRumor) currentRumor.significance = line.replace('Significance:', '').trim();
      }
    });
    
    if (currentRumor?.text) {
      newRumors.push({
        id: `r${Date.now()}_${Math.random()}`,
        text: currentRumor.text,
        significance: currentRumor.significance || '',
        inCirculation: false,
        isPublic: false,
        drawnBy: null,
        sharedWith: []
      });
    }
    
    updateGameState({ rumors: [...gameState.rumors, ...newRumors] });
    setRumorInput('');
  };

  const plantRumor = () => {
    if (!plantInput.trim()) return;
    const planted = {
      id: `plant_${Date.now()}`,
      text: plantInput.trim(),
      significance: 'Host-planted',
      inCirculation: true,
      isPublic: true,
      drawnBy: null,
      sharedWith: []
    };
    
    const systemMsg = {
      id: `m${Date.now()}`,
      senderId: 'SYSTEM',
      senderName: 'MAINFRAME',
      text: `🚨 BREAKING: ${plantInput.trim()}`,
      timestamp: Date.now(),
      isSystemMessage: true
    };
    
    updateGameState({
      rumors: [...gameState.rumors, planted],
      chatMessages: [...gameState.chatMessages, systemMsg]
    });
    setPlantInput('');
  };

  const activateRumor = (id) => {
    const updated = gameState.rumors.map(r => 
      r.id === id ? { ...r, inCirculation: true } : r
    );
    updateGameState({ rumors: updated });
  };

  const makePublicRumor = (id) => {
    const rumor = gameState.rumors.find(r => r.id === id);
    const updated = gameState.rumors.map(r => 
      r.id === id ? { ...r, isPublic: true } : r
    );
    
    const systemMsg = {
      id: `m${Date.now()}`,
      senderId: 'SYSTEM',
      senderName: 'MAINFRAME',
      text: `📢 NEW INTEL: ${rumor.text}`,
      timestamp: Date.now(),
      isSystemMessage: true
    };
    
    updateGameState({
      rumors: updated,
      chatMessages: [...gameState.chatMessages, systemMsg]
    });
  };

  // Guest rumor handlers
  const confirmRumor = () => {
    if (!rumorConfirmInput.trim()) return;
    const rumor = gameState.rumors.find(r => 
      r.text.toLowerCase().includes(rumorConfirmInput.toLowerCase()) && !r.inCirculation
    );
    
    if (rumor) {
      const updated = gameState.rumors.map(r =>
        r.id === rumor.id ? { ...r, inCirculation: true, drawnBy: myCharId } : r
      );
      updateGameState({ rumors: updated });
      setRumorConfirmInput('');
      alert('Rumor confirmed!');
    } else {
      alert('Rumor not found or already claimed');
    }
  };

  const shareRumorPublic = (id) => {
    const rumor = gameState.rumors.find(r => r.id === id);
    const updated = gameState.rumors.map(r => 
      r.id === id ? { ...r, isPublic: true } : r
    );
    
    const myChar = ROSTER.find(c => c.id === myCharId);
    const msg = {
      id: `m${Date.now()}`,
      senderId: myCharId,
      senderName: myChar.name,
      text: `📢 ${rumor.text}`,
      timestamp: Date.now(),
      isSystemMessage: false
    };
    
    updateGameState({
      rumors: updated,
      chatMessages: [...gameState.chatMessages, msg]
    });
  };

  // Chat handlers
  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const myChar = ROSTER.find(c => c.id === myCharId);
    const msg = {
      id: `m${Date.now()}`,
      senderId: myCharId,
      senderName: myChar.name,
      text: chatInput.trim(),
      timestamp: Date.now(),
      isSystemMessage: false
    };
    
    updateGameState({ chatMessages: [...gameState.chatMessages, msg] });
    setChatInput('');
  };

  // Voting handlers
  const castVote = (suspectId) => {
    const newVotes = { ...gameState.playerVotes, [myCharId]: suspectId };
    updateGameState({ playerVotes: newVotes });
  };

  const revealKiller = () => {
    const voteCounts = {};
    ROSTER.forEach(c => voteCounts[c.id] = 0);
    Object.values(gameState.playerVotes).forEach(suspectId => {
      if (voteCounts[suspectId] !== undefined) voteCounts[suspectId]++;
    });
    
    const maxVotes = Math.max(...Object.values(voteCounts));
    const leaders = Object.entries(voteCounts).filter(([_, count]) => count === maxVotes);
    const leaderId = leaders.length === 1 ? leaders[0][0] : null;
    
    if (leaderId === gameState.killerId) {
      setRevealResult({ correct: true, message: '✓ CORRECT! THE KILLER HAS BEEN CAUGHT!' });
    } else {
      const actualKiller = ROSTER.find(c => c.id === gameState.killerId);
      setRevealResult({ 
        correct: false, 
        message: `✗ WRONG! The killer was ${actualKiller?.name}! They escaped into the night...`
      });
    }
  };

  // Timeline handler
  const toggleTimeline = (eventId) => {
    const current = gameState.timelineStatus || {};
    updateGameState({ 
      timelineStatus: { ...current, [eventId]: !current[eventId] }
    });
  };

  // Reset game
  const resetGame = () => {
    setMode('landing');
    setIsLoggedIn(false);
    setActiveTab('TIMELINE');
    setRevealResult(null);
    setGameState({
      guestNames: {},
      characterPins: {},
      killerId: null,
      victimId: null,
      rumors: [],
      chatMessages: [],
      playerVotes: {},
      propStatus: {},
      pendingEvidence: [],
      timelineEvents: DEFAULT_TIMELINE,
      timelineStatus: {},
      bioCache: {},
      storyData: null,
      isLocked: false
    });
  };

  // Modal Component
  const Modal = ({ children, onClose }) => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#000',
        border: '2px solid #00ff00',
        padding: '24px',
        maxWidth: '400px',
        width: '90%'
      }}>
        {children}
      </div>
    </div>
  );

  // LANDING PAGE
  if (mode === 'landing') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #000 0%, #001a00 50%, #000 100%)',
        color: '#00ff00',
        fontFamily: '"Courier New", monospace',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Scanline effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: '12px',
            letterSpacing: '8px',
            marginBottom: '20px',
            opacity: 0.7,
            animation: 'blink 1s infinite'
          }}>
            ▓▓▓ SYSTEM ONLINE ▓▓▓
          </div>
          
          <h1 style={{
            fontSize: '48px',
            marginBottom: '10px',
            letterSpacing: '8px',
            textShadow: '0 0 20px #00ff00, 0 0 40px #00ff00',
            fontWeight: 'bold'
          }}>
            MILLENNIUM
          </h1>
          <h1 style={{
            fontSize: '48px',
            marginBottom: '40px',
            letterSpacing: '8px',
            textShadow: '0 0 20px #ff0000, 0 0 40px #ff0000',
            color: '#ff0000',
            fontWeight: 'bold'
          }}>
            MASSACRE
          </h1>
          
          <div style={{ 
            fontSize: '14px', 
            marginBottom: '40px', 
            opacity: 0.6,
            letterSpacing: '4px'
          }}>
            CLASS OF '99 SENIOR LOCK-IN
          </div>
          
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={createHost} 
              style={{
                padding: '20px 40px',
                border: '2px solid #00ff00',
                background: 'transparent',
                color: '#00ff00',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}
              onMouseOver={e => {
                e.target.style.background = '#00ff00';
                e.target.style.color = '#000';
              }}
              onMouseOut={e => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#00ff00';
              }}
            >
              🖥️ HOST TERMINAL
            </button>
            <button 
              onClick={joinGuest} 
              style={{
                padding: '20px 40px',
                border: '2px solid #00ff00',
                background: 'transparent',
                color: '#00ff00',
                cursor: 'pointer',
                fontFamily: '"Courier New", monospace',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}
              onMouseOver={e => {
                e.target.style.background = '#00ff00';
                e.target.style.color = '#000';
              }}
              onMouseOut={e => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#00ff00';
              }}
            >
              👤 GUEST LOGIN
            </button>
          </div>
          
          <p style={{ marginTop: '40px', fontSize: '12px', opacity: 0.3, letterSpacing: '2px' }}>
            ► READY FOR DEPLOYMENT ◄
          </p>
        </div>
        
        {/* Join Modal */}
        {showJoinModal && (
          <Modal>
            <h3 style={{ marginBottom: '20px', color: '#00ff00', fontFamily: '"Courier New", monospace' }}>
              ENTER ROOM CODE
            </h3>
            <input
              type="text"
              value={joinCodeInput}
              onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="XXXX"
              maxLength={4}
              style={{
                width: '100%',
                padding: '12px',
                background: '#001100',
                border: '1px solid #00ff00',
                color: '#00ff00',
                fontFamily: '"Courier New", monospace',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
                marginBottom: '20px'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={confirmJoin}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#00ff00',
                  color: '#000',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontFamily: '"Courier New", monospace'
                }}
              >
                JOIN
              </button>
              <button
                onClick={() => { setShowJoinModal(false); setJoinCodeInput(''); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  color: '#00ff00',
                  border: '1px solid #00ff00',
                  cursor: 'pointer',
                  fontFamily: '"Courier New", monospace'
                }}
              >
                CANCEL
              </button>
            </div>
          </Modal>
        )}
        
        <style>{`
          @keyframes blink {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  // HOST TERMINAL
  if (mode === 'host') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000',
        color: '#00ff00',
        fontFamily: '"Courier New", monospace'
      }}>
        {/* Header */}
        <div style={{
          borderBottom: '1px solid #00ff00',
          padding: '16px 20px',
          background: 'linear-gradient(180deg, #001a00 0%, #000 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px' }}>
              🖥️ HOST TERMINAL
            </span>
            <span style={{
              background: '#00ff00',
              color: '#000',
              padding: '6px 16px',
              fontWeight: 'bold',
              fontSize: '18px',
              letterSpacing: '4px'
            }}>
              ROOM: {roomCode}
            </span>
            {gameState.isLocked && (
              <span style={{
                background: '#ff0000',
                color: '#fff',
                padding: '4px 12px',
                fontSize: '12px'
              }}>
                🔒 LOCKED
              </span>
            )}
          </div>
          <button
            onClick={resetGame}
            style={{
              background: 'transparent',
              border: '1px solid #ff0000',
              color: '#ff0000',
              padding: '8px 16px',
              cursor: 'pointer',
              fontFamily: '"Courier New", monospace',
              fontSize: '12px'
            }}
          >
            ⏻ RESET
          </button>
        </div>
        
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
          {/* Sidebar */}
          <div style={{
            width: '200px',
            borderRight: '1px solid #003300',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: '#000a00'
          }}>
            {['TIMELINE', 'STORY', 'DATABASE', 'RUMORS', 'CHAT', 'VOTING'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 16px',
                  background: activeTab === tab ? '#00ff00' : 'transparent',
                  color: activeTab === tab ? '#000' : '#00ff00',
                  border: activeTab === tab ? 'none' : '1px solid #003300',
                  cursor: 'pointer',
                  fontFamily: '"Courier New", monospace',
                  fontSize: '13px',
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                {tab === 'TIMELINE' && '⏱️ '}
                {tab === 'STORY' && '📖 '}
                {tab === 'DATABASE' && '👥 '}
                {tab === 'RUMORS' && '🗣️ '}
                {tab === 'CHAT' && '💬 '}
                {tab === 'VOTING' && '🗳️ '}
                {tab}
              </button>
            ))}
          </div>
          
          {/* Main Content */}
          <div style={{
            flex: 1,
            padding: '20px',
            maxHeight: 'calc(100vh - 60px)',
            overflowY: 'auto'
          }}>
            {/* STORY TAB */}
            {activeTab === 'STORY' && (
              <div style={{ border: '1px solid #00ff00', padding: '20px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '24px', letterSpacing: '2px' }}>
                  📖 SCENARIO GENERATOR
                </h2>
                
                {!gameState.isLocked ? (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '20px',
                      marginBottom: '24px'
                    }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '10px', opacity: 0.8 }}>
                          🔪 SELECT KILLER:
                        </label>
                        <select
                          id="killerSelect"
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: '#001100',
                            border: '1px solid #00ff00',
                            color: '#00ff00',
                            fontFamily: '"Courier New", monospace',
                            fontSize: '14px'
                          }}
                        >
                          <option value="">Choose...</option>
                          {ROSTER.map(c => (
                            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '10px', opacity: 0.8 }}>
                          💀 SELECT VICTIM:
                        </label>
                        <select
                          id="victimSelect"
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: '#001100',
                            border: '1px solid #00ff00',
                            color: '#00ff00',
                            fontFamily: '"Courier New", monospace',
                            fontSize: '14px'
                          }}
                        >
                          <option value="">Choose...</option>
                          {ROSTER.map(c => (
                            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <button
                      onClick={generateStory}
                      disabled={generating}
                      style={{
                        padding: '16px 32px',
                        background: generating ? '#003300' : '#00ff00',
                        color: '#000',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        cursor: generating ? 'wait' : 'pointer',
                        fontFamily: '"Courier New", monospace',
                        letterSpacing: '2px'
                      }}
                    >
                      {generating ? '⏳ GENERATING...' : '⚡ GENERATE STORY'}
                    </button>
                    
                    <p style={{ marginTop: '16px', fontSize: '12px', opacity: 0.5 }}>
                      This will lock in the scenario and generate character materials.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      border: '2px solid #00ff00',
                      padding: '20px',
                      marginBottom: '20px',
                      background: '#001a00'
                    }}>
                      <h3 style={{ marginBottom: '16px', color: '#00ff00' }}>🔒 ACTIVE SCENARIO</h3>
                      <div style={{ marginBottom: '12px' }}>
                        <strong>🔪 Killer:</strong> {ROSTER.find(c => c.id === gameState.killerId)?.emoji} {ROSTER.find(c => c.id === gameState.killerId)?.name}
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <strong>💀 Victim:</strong> {ROSTER.find(c => c.id === gameState.victimId)?.emoji} {ROSTER.find(c => c.id === gameState.victimId)?.name}
                      </div>
                      {gameState.storyData && (
                        <>
                          <div style={{ marginTop: '16px', marginBottom: '12px' }}>
                            <strong>💡 Motive:</strong>
                            <p style={{ marginTop: '8px', opacity: 0.9, lineHeight: 1.5 }}>
                              {gameState.storyData.motive}
                            </p>
                          </div>
                          <div style={{
                            marginTop: '16px',
                            padding: '16px',
                            background: '#000',
                            borderLeft: '3px solid #00ff00',
                            fontSize: '13px',
                            lineHeight: 1.6
                          }}>
                            <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '8px' }}>
                              RECONSTRUCTION:
                            </div>
                            {gameState.storyData.reconstruction}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Evidence Matrix */}
                    {gameState.storyData?.evidence_matrix && (
                      <div style={{ border: '1px solid #003300', padding: '16px' }}>
                        <h4 style={{ marginBottom: '12px' }}>📋 EVIDENCE MATRIX</h4>
                        {gameState.storyData.evidence_matrix.map((evidence, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '12px',
                              marginBottom: '8px',
                              background: '#001100',
                              border: '1px solid #003300',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <strong>{evidence.prop_name}</strong>
                              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
                                {evidence.clue}
                              </div>
                            </div>
                            <span style={{
                              padding: '4px 8px',
                              fontSize: '10px',
                              background: evidence.type === 'CRITICAL' ? '#ff0000' : 
                                         evidence.type === 'RED_HERRING' ? '#ffff00' : '#00ff00',
                              color: '#000'
                            }}>
                              {evidence.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* TIMELINE TAB */}
            {activeTab === 'TIMELINE' && (
              <div style={{ border: '1px solid #00ff00', padding: '20px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '24px', letterSpacing: '2px' }}>
                  ⏱️ EVENT TIMELINE
                </h2>
                {gameState.timelineEvents.map((evt, idx) => {
                  const isComplete = gameState.timelineStatus?.[evt.id];
                  return (
                    <div
                      key={evt.id}
                      style={{
                        border: `1px solid ${isComplete ? '#003300' : '#00ff00'}`,
                        padding: '20px',
                        marginBottom: '16px',
                        opacity: isComplete ? 0.5 : 1,
                        background: isComplete ? '#001100' : 'transparent',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        left: '-12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '24px',
                        height: '24px',
                        background: isComplete ? '#003300' : '#00ff00',
                        color: isComplete ? '#00ff00' : '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}>
                        {idx + 1}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1, marginLeft: '16px' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <span style={{
                              background: '#003300',
                              padding: '4px 10px',
                              fontSize: '14px',
                              marginRight: '12px'
                            }}>
                              {evt.time}
                            </span>
                            <strong style={{
                              fontSize: '18px',
                              textDecoration: isComplete ? 'line-through' : 'none'
                            }}>
                              {evt.title}
                            </strong>
                          </div>
                          <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '12px' }}>
                            {evt.description}
                          </div>
                          
                          {evt.script && (
                            <div style={{
                              marginTop: '16px',
                              padding: '16px',
                              background: '#000',
                              borderLeft: '3px solid #ffff00',
                              fontSize: '13px',
                              lineHeight: 1.6
                            }}>
                              <div style={{
                                fontSize: '10px',
                                background: '#ffff00',
                                color: '#000',
                                display: 'inline-block',
                                padding: '2px 8px',
                                marginBottom: '10px',
                                fontWeight: 'bold'
                              }}>
                                📜 HOST SCRIPT
                              </div>
                              <div style={{ whiteSpace: 'pre-wrap' }}>{evt.script}</div>
                            </div>
                          )}
                        </div>
                        
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          marginLeft: '20px'
                        }}>
                          <input
                            type="checkbox"
                            checked={isComplete || false}
                            onChange={() => toggleTimeline(evt.id)}
                            style={{ width: '20px', height: '20px', accentColor: '#00ff00' }}
                          />
                          <span style={{ fontSize: '12px' }}>
                            {isComplete ? '✓ DONE' : 'MARK'}
                          </span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* DATABASE TAB */}
            {activeTab === 'DATABASE' && (
              <div style={{ border: '1px solid #00ff00', padding: '20px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '24px', letterSpacing: '2px' }}>
                  👥 CHARACTER DATABASE
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px'
                }}>
                  {ROSTER.map(char => {
                    const isKiller = char.id === gameState.killerId;
                    const isVictim = char.id === gameState.victimId;
                    const playerName = gameState.guestNames[char.id];
                    
                    return (
                      <div
                        key={char.id}
                        style={{
                          border: `1px solid ${isKiller ? '#ff0000' : isVictim ? '#ffff00' : '#003300'}`,
                          padding: '16px',
                          background: '#001100'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '12px'
                        }}>
                          <span style={{ fontSize: '36px' }}>{char.emoji}</span>
                          <div>
                            <div style={{
                              fontWeight: 'bold',
                              fontSize: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              {char.name}
                              {isKiller && <span style={{ color: '#ff0000', fontSize: '12px' }}>🔪 KILLER</span>}
                              {isVictim && <span style={{ color: '#ffff00', fontSize: '12px' }}>💀 VICTIM</span>}
                            </div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>
                              {playerName ? `Played by: ${playerName}` : '⏳ Unassigned'}
                            </div>
                            {gameState.characterPins[char.id] && (
                              <div style={{ fontSize: '11px', color: '#ffff00', marginTop: '4px' }}>
                                PIN: {gameState.characterPins[char.id]}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.8, fontStyle: 'italic' }}>
                          "{char.slogan}"
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '8px' }}>
                          {char.static_bio}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* RUMORS TAB */}
            {activeTab === 'RUMORS' && (
              <div style={{ border: '1px solid #00ff00', padding: '20px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '24px', letterSpacing: '2px' }}>
                  🗣️ RUMOR MANAGEMENT
                </h2>
                
                {/* Parse Rumors */}
                <div style={{
                  border: '1px solid #003300',
                  padding: '16px',
                  marginBottom: '20px',
                  background: '#001100'
                }}>
                  <label style={{ display: 'block', marginBottom: '10px', opacity: 0.8 }}>
                    📝 PARSE RUMORS (bulk import):
                  </label>
                  <textarea
                    value={rumorInput}
                    onChange={e => setRumorInput(e.target.value)}
                    style={{
                      width: '100%',
                      height: '120px',
                      background: '#000',
                      border: '1px solid #003300',
                      padding: '12px',
                      color: '#00ff00',
                      fontFamily: '"Courier New", monospace',
                      fontSize: '12px',
                      resize: 'vertical'
                    }}
                    placeholder="Rumor: Someone saw Chad sneaking out...&#10;Significance: Places Chad at the scene&#10;&#10;Rumor: Regina's locker had blood on it...&#10;Significance: Physical evidence"
                  />
                  <button
                    onClick={parseRumors}
                    style={{
                      marginTop: '10px',
                      padding: '10px 20px',
                      background: '#00ff00',
                      color: '#000',
                      border: 'none',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontFamily: '"Courier New", monospace'
                    }}
                  >
                    ➕ PARSE & ADD
                  </button>
                </div>
                
                {/* Quick Plant */}
                <div style={{
                  border: '1px solid #990000',
                  padding: '16px',
                  marginBottom: '20px',
                  background: '#1a0000'
                }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: '#ff6666' }}>
                    🚨 QUICK BROADCAST (instant public announcement):
                  </label>
                  <input
                    type="text"
                    value={plantInput}
                    onChange={e => setPlantInput(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#000',
                      border: '1px solid #660000',
                      padding: '12px',
                      color: '#ff6666',
                      fontFamily: '"Courier New", monospace'
                    }}
                    placeholder="Breaking news to broadcast to all players..."
                  />
                  <button
                    onClick={plantRumor}
                    style={{
                      marginTop: '10px',
                      padding: '10px 20px',
                      background: '#cc0000',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontFamily: '"Courier New", monospace'
                    }}
                  >
                    📢 BROADCAST NOW
                  </button>
                </div>
                
                {/* Rumor Database */}
                <h3 style={{ marginBottom: '12px', opacity: 0.8 }}>
                  📋 DATABASE ({gameState.rumors.length} rumors)
                </h3>
                {gameState.rumors.length === 0 ? (
                  <div style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>
                    No rumors in database. Add some above!
                  </div>
                ) : (
                  gameState.rumors.map(r => (
                    <div
                      key={r.id}
                      style={{
                        border: '1px solid #003300',
                        padding: '16px',
                        marginBottom: '10px',
                        background: '#001100'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>{r.text}</div>
                      <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '10px' }}>
                        Significance: {r.significance || 'None specified'}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {!r.inCirculation && (
                          <button
                            onClick={() => activateRumor(r.id)}
                            style={{
                              fontSize: '11px',
                              padding: '6px 12px',
                              background: '#003300',
                              border: '1px solid #00ff00',
                              color: '#00ff00',
                              cursor: 'pointer',
                              fontFamily: '"Courier New", monospace'
                            }}
                          >
                            ▶ ACTIVATE
                          </button>
                        )}
                        {r.inCirculation && !r.isPublic && (
                          <button
                            onClick={() => makePublicRumor(r.id)}
                            style={{
                              fontSize: '11px',
                              padding: '6px 12px',
                              background: '#996600',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: '"Courier New", monospace'
                            }}
                          >
                            📢 MAKE PUBLIC
                          </button>
                        )}
                        {r.inCirculation && !r.isPublic && (
                          <span style={{ fontSize: '11px', color: '#ffff00', padding: '6px' }}>
                            ⏳ In Circulation
                          </span>
                        )}
                        {r.isPublic && (
                          <span style={{
                            fontSize: '11px',
                            padding: '6px 12px',
                            background: '#009900',
                            color: '#fff'
                          }}>
                            ✓ PUBLIC
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {/* CHAT TAB */}
            {activeTab === 'CHAT' && (
              <div style={{ border: '1px solid #00ff00', padding: '20px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '24px', letterSpacing: '2px' }}>
                  💬 CHAT TRANSCRIPTS
                </h2>
                {gameState.chatMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', opacity: 0.5, padding: '60px' }}>
                    No messages yet. Players will see their chat here.
                  </div>
                ) : (
                  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {gameState.chatMessages.map(msg => (
                      <div
                        key={msg.id}
                        style={{
                          borderLeft: `3px solid ${msg.isSystemMessage ? '#ff0000' : '#003300'}`,
                          paddingLeft: '16px',
                          paddingTop: '12px',
                          paddingBottom: '12px',
                          marginBottom: '12px',
                          background: msg.isSystemMessage ? '#1a0000' : 'transparent'
                        }}
                      >
                        <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>
                          {msg.senderName} · {timeAgo(msg.timestamp)}
                        </div>
                        <div style={{ fontSize: '14px' }}>{msg.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* VOTING TAB */}
            {activeTab === 'VOTING' && (
              <div style={{ border: '1px solid #00ff00', padding: '20px' }}>
                <h2 style={{ fontSize: '24px', marginBottom: '24px', letterSpacing: '2px' }}>
                  🗳️ VOTING RESULTS
                </h2>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '16px',
                  marginBottom: '30px'
                }}>
                  {ROSTER.map(char => {
                    const votes = Object.values(gameState.playerVotes).filter(v => v === char.id).length;
                    const isKiller = char.id === gameState.killerId;
                    
                    return (
                      <div
                        key={char.id}
                        style={{
                          border: `1px solid ${isKiller && revealResult ? '#ff0000' : '#003300'}`,
                          padding: '20px',
                          textAlign: 'center',
                          background: '#001100'
                        }}
                      >
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>{char.emoji}</div>
                        <div style={{
                          fontSize: '36px',
                          fontWeight: 'bold',
                          color: votes > 0 ? '#00ff00' : '#003300',
                          marginBottom: '8px'
                        }}>
                          {votes}
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.7 }}>{char.name}</div>
                        {isKiller && revealResult && (
                          <div style={{ color: '#ff0000', fontSize: '10px', marginTop: '8px' }}>
                            🔪 THE KILLER
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Vote breakdown */}
                <div style={{
                  border: '1px solid #003300',
                  padding: '16px',
                  marginBottom: '20px',
                  background: '#001100'
                }}>
                  <h4 style={{ marginBottom: '12px', opacity: 0.8 }}>📊 WHO VOTED FOR WHOM:</h4>
                  {Object.entries(gameState.playerVotes).length === 0 ? (
                    <div style={{ opacity: 0.5, fontSize: '13px' }}>No votes cast yet</div>
                  ) : (
                    Object.entries(gameState.playerVotes).map(([voterId, suspectId]) => {
                      const voter = ROSTER.find(c => c.id === voterId);
                      const suspect = ROSTER.find(c => c.id === suspectId);
                      return (
                        <div key={voterId} style={{ fontSize: '13px', marginBottom: '6px' }}>
                          {voter?.emoji} {voter?.name} → {suspect?.emoji} {suspect?.name}
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* Reveal Button */}
                {gameState.isLocked && (
                  <div style={{
                    borderTop: '1px solid #00ff00',
                    paddingTop: '24px',
                    textAlign: 'center'
                  }}>
                    {!revealResult ? (
                      <button
                        onClick={revealKiller}
                        style={{
                          padding: '18px 50px',
                          background: 'linear-gradient(180deg, #cc0000 0%, #660000 100%)',
                          color: '#fff',
                          border: '2px solid #ff0000',
                          fontSize: '20px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontFamily: '"Courier New", monospace',
                          letterSpacing: '2px'
                        }}
                      >
                        🎭 REVEAL THE KILLER
                      </button>
                    ) : (
                      <div style={{
                        padding: '24px',
                        border: `3px solid ${revealResult.correct ? '#00ff00' : '#ff0000'}`,
                        background: revealResult.correct ? '#001a00' : '#1a0000',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: revealResult.correct ? '#00ff00' : '#ff0000'
                      }}>
                        {revealResult.message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // GUEST PORTAL
  if (mode === 'guest') {
    // Character Selection Screen
    if (!isLoggedIn) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            background: '#fff',
            borderRadius: '0',
            border: '3px solid #333',
            boxShadow: '8px 8px 0 rgba(0,0,0,0.3)'
          }}>
            <div style={{
              background: 'linear-gradient(180deg, #6699cc 0%, #4477aa 100%)',
              color: 'white',
              padding: '16px 20px',
              fontWeight: 'bold',
              fontSize: '18px',
              borderBottom: '3px solid #333',
              fontFamily: 'Impact, sans-serif',
              letterSpacing: '1px'
            }}>
              🎭 SELECT YOUR CHARACTER
            </div>
            <div style={{
              padding: '8px',
              background: '#c0c0c0',
              borderBottom: '2px solid #808080',
              fontSize: '12px'
            }}>
              Room: <strong>{roomCode}</strong>
            </div>
            <div style={{ padding: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
              {ROSTER.map(char => {
                const taken = !!gameState.guestNames[char.id];
                return (
                  <div
                    key={char.id}
                    onClick={() => !taken && loginAs(char.id)}
                    style={{
                      marginBottom: '10px',
                      padding: '14px',
                      background: taken ? '#e0e0e0' : '#f9f9f9',
                      border: '2px solid #999',
                      opacity: taken ? 0.6 : 1,
                      cursor: taken ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => {
                      if (!taken) e.currentTarget.style.background = '#e8f0ff';
                    }}
                    onMouseOut={e => {
                      if (!taken) e.currentTarget.style.background = '#f9f9f9';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '32px' }}>{char.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '16px',
                          color: '#333',
                          fontFamily: 'Georgia, serif'
                        }}>
                          {char.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#666',
                          fontStyle: 'italic',
                          marginTop: '2px'
                        }}>
                          "{char.slogan}"
                        </div>
                        {taken && (
                          <div style={{
                            fontSize: '11px',
                            color: '#c00',
                            marginTop: '4px',
                            fontWeight: 'bold'
                          }}>
                            ✗ Taken by {gameState.guestNames[char.id]}
                          </div>
                        )}
                      </div>
                      {!taken && (
                        <div style={{ color: '#4477aa', fontSize: '20px' }}>→</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{
              padding: '12px',
              background: '#c0c0c0',
              borderTop: '2px solid #808080',
              textAlign: 'center'
            }}>
              <button
                onClick={resetGame}
                style={{
                  padding: '8px 20px',
                  background: '#808080',
                  border: '2px outset #c0c0c0',
                  color: '#000',
                  cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '12px'
                }}
              >
                ← Back
              </button>
            </div>
          </div>
          
          {/* Name Input Modal */}
          {showNameModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: '#c0c0c0',
                border: '3px solid #333',
                padding: '0',
                width: '320px',
                boxShadow: '8px 8px 0 rgba(0,0,0,0.3)'
              }}>
                <div style={{
                  background: 'linear-gradient(180deg, #000080 0%, #000050 100%)',
                  color: '#fff',
                  padding: '8px 12px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  Enter Your Name
                </div>
                <div style={{ padding: '20px' }}>
                  <p style={{ marginBottom: '12px', fontSize: '13px' }}>
                    You selected: <strong>{ROSTER.find(c => c.id === selectedCharForLogin)?.name}</strong>
                  </p>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    placeholder="Your real name..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px inset #808080',
                      fontSize: '14px',
                      marginBottom: '16px'
                    }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={confirmLogin}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#c0c0c0',
                        border: '2px outset #fff',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      OK
                    </button>
                    <button
                      onClick={() => {
                        setShowNameModal(false);
                        setNameInput('');
                        setSelectedCharForLogin(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#c0c0c0',
                        border: '2px outset #fff',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Logged In Guest View (MySpace-style)
    const myChar = ROSTER.find(c => c.id === myCharId);
    const myBio = gameState.bioCache[myCharId];
    const myRumors = gameState.rumors.filter(r => 
      r.drawnBy === myCharId || r.isPublic || r.sharedWith?.includes(myCharId)
    );
    const myVote = gameState.playerVotes[myCharId];
    
    return (
      <div style={{
        minHeight: '100vh',
        background: '#336699',
        paddingBottom: '80px',
        fontFamily: 'Arial, Helvetica, sans-serif'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: '#fff'
        }}>
          {/* Header Bar */}
          <div style={{
            background: 'linear-gradient(180deg, #003366 0%, #001a33 100%)',
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '3px solid #ff6600'
          }}>
            <div style={{
              color: '#fff',
              fontSize: '22px',
              fontWeight: 'bold',
              fontFamily: 'Impact, sans-serif',
              letterSpacing: '1px'
            }}>
              <span style={{ color: '#ff6600' }}>MILLENNIUM</span> MASSACRE ★
            </div>
            <button
              onClick={resetGame}
              style={{
                color: '#aaa',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline'
              }}
            >
              Sign Out
            </button>
          </div>
          
          {/* Profile Header */}
          <div style={{
            background: 'linear-gradient(180deg, #e8f4fc 0%, #cce5f5 100%)',
            padding: '24px',
            borderBottom: '3px solid #99ccee'
          }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{
                width: '120px',
                height: '120px',
                border: '4px solid #003366',
                background: 'linear-gradient(135deg, #fff 0%, #e0e0e0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '60px',
                boxShadow: '4px 4px 8px rgba(0,0,0,0.2)'
              }}>
                {myChar.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#003366',
                  fontFamily: 'Georgia, serif',
                  marginBottom: '8px'
                }}>
                  {myChar.name}'s Page
                </div>
                <div style={{
                  background: '#fff',
                  border: '2px solid #99ccee',
                  padding: '10px 14px',
                  fontStyle: 'italic',
                  color: '#666',
                  fontSize: '14px',
                  marginBottom: '12px'
                }}>
                  "{myChar.slogan}"
                </div>
                <div style={{ fontSize: '13px', color: '#333' }}>
                  <div><strong style={{ color: '#003366' }}>Character:</strong> {myChar.name}</div>
                  <div><strong style={{ color: '#003366' }}>Player:</strong> {myName}</div>
                  <div><strong style={{ color: '#003366' }}>Room:</strong> {roomCode}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Area */}
          <div style={{ padding: '16px' }}>
            {/* HOME TAB */}
            {activeTab === 'HOME' && (
              <>
                {/* Secret Objective */}
                {myBio && (
                  <>
                    <div style={{
                      background: '#fff',
                      border: '3px solid #ff6600',
                      marginBottom: '16px',
                      boxShadow: '3px 3px 6px rgba(0,0,0,0.15)'
                    }}>
                      <div style={{
                        background: 'linear-gradient(180deg, #ff6600 0%, #cc5200 100%)',
                        color: 'white',
                        padding: '10px 14px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        borderBottom: '2px solid #994400'
                      }}>
                        🎯 YOUR SECRET OBJECTIVE
                      </div>
                      <div style={{ padding: '14px' }}>
                        <p style={{ marginBottom: '10px', fontSize: '14px' }}>
                          <strong>Mission:</strong> {myBio.objective}
                        </p>
                        <p style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                          {myBio.notes}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{
                      background: '#fff',
                      border: '3px solid #cc0000',
                      marginBottom: '16px',
                      boxShadow: '3px 3px 6px rgba(0,0,0,0.15)'
                    }}>
                      <div style={{
                        background: 'linear-gradient(180deg, #cc0000 0%, #990000 100%)',
                        color: 'white',
                        padding: '10px 14px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        borderBottom: '2px solid #660000'
                      }}>
                        🤐 YOUR DARK SECRET
                      </div>
                      <div style={{ padding: '14px' }}>
                        <p style={{
                          color: '#cc0000',
                          fontWeight: 'bold',
                          marginBottom: '10px',
                          fontSize: '14px'
                        }}>
                          {myBio.secret}
                        </p>
                        <p style={{ fontSize: '12px' }}>
                          <strong>Your Alibi:</strong> {myBio.alibi}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Latest Updates */}
                <div style={{
                  background: '#fff',
                  border: '3px solid #ff6600',
                  boxShadow: '3px 3px 6px rgba(0,0,0,0.15)'
                }}>
                  <div style={{
                    background: 'linear-gradient(180deg, #ff6600 0%, #cc5200 100%)',
                    color: 'white',
                    padding: '10px 14px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    borderBottom: '2px solid #994400'
                  }}>
                    📰 LATEST UPDATES
                  </div>
                  <div style={{ padding: '14px' }}>
                    {gameState.chatMessages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                        No updates yet. Stay tuned...
                      </div>
                    ) : (
                      gameState.chatMessages.slice(-5).reverse().map(msg => (
                        <div
                          key={msg.id}
                          style={{
                            background: msg.isSystemMessage ? '#fff0f0' : '#fffbf0',
                            border: `1px solid ${msg.isSystemMessage ? '#ffcccc' : '#ffcc66'}`,
                            padding: '10px 12px',
                            marginBottom: '8px',
                            borderRadius: '4px'
                          }}
                        >
                          <div style={{
                            fontWeight: 'bold',
                            color: msg.isSystemMessage ? '#cc0000' : '#cc6600',
                            fontSize: '11px',
                            marginBottom: '4px'
                          }}>
                            {msg.senderName} · {timeAgo(msg.timestamp)}
                          </div>
                          <div style={{ fontSize: '13px', color: '#333' }}>{msg.text}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
            
            {/* RUMORS TAB */}
            {activeTab === 'RUMORS' && (
              <div style={{
                background: '#fff',
                border: '3px solid #ff6600',
                boxShadow: '3px 3px 6px rgba(0,0,0,0.15)'
              }}>
                <div style={{
                  background: 'linear-gradient(180deg, #ff6600 0%, #cc5200 100%)',
                  color: 'white',
                  padding: '10px 14px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  borderBottom: '2px solid #994400'
                }}>
                  🗨️ YOUR INTEL
                </div>
                <div style={{ padding: '14px' }}>
                  {/* Confirm a rumor */}
                  <div style={{
                    background: '#fffbf0',
                    border: '2px solid #ffcc66',
                    padding: '14px',
                    marginBottom: '16px'
                  }}>
                    <p style={{ fontSize: '13px', marginBottom: '10px', color: '#996600' }}>
                      🏷️ Found a physical POG or clue? Register it here:
                    </p>
                    <input
                      type="text"
                      value={rumorConfirmInput}
                      onChange={e => setRumorConfirmInput(e.target.value)}
                      placeholder="Type the rumor text from the POG..."
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px inset #ccc',
                        marginBottom: '10px',
                        fontSize: '13px'
                      }}
                    />
                    <button
                      onClick={confirmRumor}
                      style={{
                        padding: '8px 24px',
                        background: 'linear-gradient(180deg, #ff6600 0%, #cc5200 100%)',
                        color: 'white',
                        border: '2px solid #994400',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✓ CONFIRM POG
                    </button>
                  </div>
                  
                  {/* Rumor List */}
                  {myRumors.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', padding: '30px' }}>
                      No intel gathered yet. Find POGs or wait for broadcasts!
                    </div>
                  ) : (
                    myRumors.map(r => (
                      <div
                        key={r.id}
                        style={{
                          background: '#fffbf0',
                          border: '1px solid #ffcc66',
                          padding: '12px',
                          marginBottom: '10px'
                        }}
                      >
                        <div style={{ fontSize: '14px', marginBottom: '10px', color: '#333' }}>
                          {r.text}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          {r.drawnBy === myCharId && !r.isPublic && (
                            <button
                              onClick={() => shareRumorPublic(r.id)}
                              style={{
                                padding: '6px 14px',
                                background: '#ff6600',
                                color: 'white',
                                border: 'none',
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                              }}
                            >
                              📢 SHARE PUBLIC
                            </button>
                          )}
                          {r.isPublic && (
                            <span style={{
                              fontSize: '11px',
                              color: '#009900',
                              fontWeight: 'bold'
                            }}>
                              ✓ PUBLIC KNOWLEDGE
                            </span>
                          )}
                          {r.drawnBy === myCharId && !r.isPublic && (
                            <span style={{ fontSize: '11px', color: '#996600' }}>
                              (Only you know this)
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {/* CHAT TAB */}
            {activeTab === 'CHAT' && (
              <div style={{
                background: '#fff',
                border: '3px solid #ff6600',
                boxShadow: '3px 3px 6px rgba(0,0,0,0.15)'
              }}>
                <div style={{
                  background: 'linear-gradient(180deg, #ff6600 0%, #cc5200 100%)',
                  color: 'white',
                  padding: '10px 14px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  borderBottom: '2px solid #994400'
                }}>
                  💬 GROUP CHAT
                </div>
                <div style={{ padding: '14px' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <textarea
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '70px',
                        padding: '10px',
                        border: '2px inset #ccc',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '13px',
                        resize: 'vertical'
                      }}
                      placeholder="Share your thoughts with the group..."
                    />
                    <button
                      onClick={sendMessage}
                      style={{
                        marginTop: '8px',
                        padding: '10px 28px',
                        background: 'linear-gradient(180deg, #ff6600 0%, #cc5200 100%)',
                        color: 'white',
                        border: '2px solid #994400',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      POST MESSAGE
                    </button>
                  </div>
                  
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {gameState.chatMessages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#999', padding: '30px' }}>
                        No messages yet. Be the first to speak!
                      </div>
                    ) : (
                      gameState.chatMessages.slice().reverse().map(msg => (
                        <div
                          key={msg.id}
                          style={{
                            background: msg.senderId === myCharId ? '#e8f4fc' : 
                                        msg.isSystemMessage ? '#fff0f0' : '#fffbf0',
                            border: `1px solid ${msg.senderId === myCharId ? '#99ccee' :
                                                 msg.isSystemMessage ? '#ffcccc' : '#ffcc66'}`,
                            padding: '12px',
                            marginBottom: '10px',
                            borderRadius: '4px'
                          }}
                        >
                          <div style={{
                            fontWeight: 'bold',
                            color: msg.isSystemMessage ? '#cc0000' : '#cc6600',
                            fontSize: '11px',
                            marginBottom: '6px'
                          }}>
                            {msg.senderName} {msg.senderId === myCharId && '(you)'} · {timeAgo(msg.timestamp)}
                          </div>
                          <div style={{ fontSize: '14px', color: '#333' }}>{msg.text}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* VOTE TAB */}
            {activeTab === 'VOTE' && (
              <div style={{
                background: '#fff',
                border: '3px solid #cc0000',
                boxShadow: '3px 3px 6px rgba(0,0,0,0.15)'
              }}>
                <div style={{
                  background: 'linear-gradient(180deg, #cc0000 0%, #990000 100%)',
                  color: 'white',
                  padding: '10px 14px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  borderBottom: '2px solid #660000'
                }}>
                  🗳️ CAST YOUR VOTE
                </div>
                <div style={{ padding: '14px' }}>
                  <p style={{ marginBottom: '16px', fontSize: '14px', color: '#333' }}>
                    Who do you think committed the murder? Choose wisely...
                  </p>
                  
                  {ROSTER.filter(c => gameState.guestNames[c.id] && c.id !== myCharId).map(char => (
                    <div
                      key={char.id}
                      onClick={() => castVote(char.id)}
                      style={{
                        marginBottom: '10px',
                        padding: '14px',
                        background: myVote === char.id ? '#ffe0e0' : '#f9f9f9',
                        border: `3px solid ${myVote === char.id ? '#cc0000' : '#ccc'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '32px' }}>{char.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: 'bold',
                            fontSize: '16px',
                            color: myVote === char.id ? '#cc0000' : '#333'
                          }}>
                            {char.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Played by: {gameState.guestNames[char.id]}
                          </div>
                        </div>
                        {myVote === char.id && (
                          <div style={{
                            color: '#cc0000',
                            fontWeight: 'bold',
                            fontSize: '24px'
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {myVote && (
                    <div style={{
                      marginTop: '20px',
                      padding: '14px',
                      background: '#ffe0e0',
                      border: '2px solid #cc0000',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}>
                      Your vote: <strong>{ROSTER.find(c => c.id === myVote)?.name}</strong>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        You can change your vote until the host reveals the killer.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Navigation */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(180deg, #333 0%, #1a1a1a 100%)',
          borderTop: '3px solid #ff6600',
          padding: '10px 0',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'space-around'
        }}>
          {['HOME', 'RUMORS', 'CHAT', 'VOTE'].map(tab => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                color: activeTab === tab ? '#ff6600' : '#aaa',
                textAlign: 'center',
                fontSize: '11px',
                cursor: 'pointer',
                flex: 1,
                padding: '4px 0',
                transition: 'color 0.2s'
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>
                {tab === 'HOME' ? '🏠' : tab === 'RUMORS' ? '💬' : tab === 'CHAT' ? '✉️' : '🗳️'}
              </div>
              <div style={{ fontWeight: activeTab === tab ? 'bold' : 'normal' }}>
                {tab}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
