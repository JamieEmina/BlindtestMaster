import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// --- État de jeu ---
let currentRound = null; // { id, track, endsAt }
let roundAnswers = {};   // { socketId: { teamId, answer, correct } }
let totalScores = { blue: 0, red: 0 };

// --- Manche factice ---
const tracks = [
  {
    id: 't1',
    title: 'Sample Track',
    artist: 'Sample Artist',
    answer: 'sample artist - sample track',
    audioUrl: '/audio/sample.mp3',
    imageUrl: '/images/sample.jpg',
    durationSec: 20
  }
];

// --- Helpers ---
function normalize(s = '') {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function endRound() {
  if (!currentRound) return;

  const solution = normalize(currentRound.track.answer);

  // Calcul des points par équipe
  const perTeam = { blue: 0, red: 0 };
  Object.values(roundAnswers).forEach(({ teamId, answer }) => {
    const ok = normalize(answer) === solution;
    if (ok) perTeam[teamId] = (perTeam[teamId] || 0) + 1;
  });

  totalScores.blue += perTeam.blue || 0;
  totalScores.red += perTeam.red || 0;

  io.emit('round:end', {
    track: currentRound.track,
    perTeam,
    totalScores
  });

  currentRound = null;
  roundAnswers = {};
}

// --- API pour démarrer une manche ---
app.post('/start-round', (req, res) => {
  if (currentRound) return res.status(400).json({ message: 'Une manche est déjà en cours.' });

  const track = tracks[0]; // pour la démo on prend la première

  const now = Date.now();
  const durationMs = (track.durationSec || 20) * 1000;
  currentRound = {
    id: 'r-' + now,
    track,
    endsAt: now + durationMs
  };
  roundAnswers = {};

  io.emit('round:start', {
    roundId: currentRound.id,
    audioUrl: track.audioUrl,
    endsAt: currentRound.endsAt
  });

  const interval = setInterval(() => {
    if (!currentRound) { clearInterval(interval); return; }
    const remaining = Math.max(0, currentRound.endsAt - Date.now());
    io.emit('round:tick', { remainingMs: remaining });
    if (remaining <= 0) {
      clearInterval(interval);
      endRound();
    }
  }, 1000);

  res.json({ ok: true, roundId: currentRound.id, endsAt: currentRound.endsAt });
});

// --- WebSocket ---
io.on('connection', (socket) => {
  console.log('Client connected', socket.id);

  socket.on('answer:submit', ({ teamId, answer }) => {
    if (!currentRound) return;
    roundAnswers[socket.id] = { teamId: teamId === 'blue' ? 'blue' : 'red', answer: String(answer || '') };
    io.emit('answers:update', { count: Object.keys(roundAnswers).length });
  });

  socket.on('disconnect', () => {
    delete roundAnswers[socket.id];
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log('Backend listening on http://localhost:' + PORT));