/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { BackendEvents } from './src/contracts/backendEvents';

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  // Global Game State
  const MAX_PLAYERS = 60;
  let playerCounter = 1;
  const players: Record<string, { id: string, name: string, position: [number, number, number], rotation: number, state: 'active' | 'disabled', disabledUntil: number, score: number, color: string, health: number, isCrouching?: boolean, isJumping?: boolean }> = {};

  // Power-ups
  let powerUps: { id: string, type: 'speed' | 'shield' | 'rapidfire', position: [number, number, number] }[] = [];
  const powerUpTypes: ('speed' | 'shield' | 'rapidfire')[] = ['speed', 'shield', 'rapidfire'];

  function spawnPowerUp() {
    if (powerUps.length >= 20) return; // Increased max
    
    const id = Math.random().toString(36).substr(2, 9);
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    // Spawn in a wider area, avoiding edges and very center
    const range = 180;
    const position: [number, number, number] = [
      (Math.random() - 0.5) * range,
      1.5,
      (Math.random() - 0.5) * range
    ];

    const powerUp = { id, type, position };
    powerUps.push(powerUp);
    io.emit('powerUpSpawned', powerUp);
  }

  setInterval(spawnPowerUp, 3000); // Spawn faster

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinGame', () => {
      if (Object.keys(players).length >= MAX_PLAYERS) {
        socket.emit('gameError', 'Server is full (60/60 players)');
        return;
      }
      
      // Assign random color
      const colors = ['#ff0055', '#00ff00', '#ffff00', '#ff00ff', '#00ffff'];
      const color = colors[Object.keys(players).length % colors.length];
      
      const playerName = `Player ${playerCounter++}`;

      players[socket.id] = {
        id: socket.id,
        name: playerName,
        position: [0, 2, 0],
        rotation: 0,
        state: 'active',
        disabledUntil: 0,
        score: 0,
        health: 100,
        color
      };

      // Send initial state
      socket.emit('gameJoined', { players, powerUps });
      // Broadcast to others
      socket.broadcast.emit('playerJoined', players[socket.id]);
    });

    socket.on('collectPowerUp', (id: string) => {
      const index = powerUps.findIndex(p => p.id === id);
      if (index !== -1) {
        const powerUp = powerUps[index];
        powerUps.splice(index, 1);
        io.emit('powerUpCollected', { id, type: powerUp.type, playerId: socket.id });
      }
    });

    socket.on('updatePosition', (data: { position: [number, number, number], rotation: number, isCrouching?: boolean, isJumping?: boolean }) => {
      if (players[socket.id]) {
        players[socket.id].position = data.position;
        players[socket.id].rotation = data.rotation;
        if (data.isCrouching !== undefined) players[socket.id].isCrouching = data.isCrouching;
        if (data.isJumping !== undefined) players[socket.id].isJumping = data.isJumping;
        socket.broadcast.emit('playerMoved', { id: socket.id, ...data });
        socket.broadcast.emit(BackendEvents.PLAYER_MOVE_SNAPSHOT, { id: socket.id, ...data });
      }
    });

    socket.on('shoot', (data: { start: [number, number, number], end: [number, number, number], color: string }) => {
      socket.broadcast.emit('playerShot', { id: socket.id, ...data });
      socket.broadcast.emit(BackendEvents.PLAYER_SHOT_BROADCAST, { id: socket.id, ...data });
    });

    socket.on('hitPlayer', (targetId: string) => {
      if (players[targetId] && players[socket.id]) {
        const now = Date.now();
        // Allow hit if active OR if disabled period has expired
        if (players[targetId].state === 'active' || now > players[targetId].disabledUntil) {
          // Reset health if they were disabled but time expired
          if (players[targetId].state === 'disabled' && now > players[targetId].disabledUntil) {
            players[targetId].health = 100;
            players[targetId].state = 'active';
          }

          players[targetId].health = Math.max(0, (players[targetId].health || 100) - 25);
          let targetDisabledUntil = 0;

          if (players[targetId].health <= 0) {
            players[targetId].state = 'disabled';
            players[targetId].disabledUntil = now + 3000;
            targetDisabledUntil = players[targetId].disabledUntil;
          }

          players[socket.id].score += 100;
          
          io.emit('playerHit', {
            targetId,
            shooterId: socket.id,
            targetDisabledUntil,
            targetHealth: players[targetId].health,
            shooterScore: players[socket.id].score
          });
          io.emit(BackendEvents.PLAYER_HIT_RESOLVED, {
            targetId,
            shooterId: socket.id,
            targetDisabledUntil,
            targetHealth: players[targetId].health,
            shooterScore: players[socket.id].score
          });
        }
      }
    });


    socket.on(BackendEvents.PLAYER_SESSION_JOIN, (payload) => {
      socket.emit(BackendEvents.PLAYER_SESSION_JOINED, {
        playerId: socket.id,
        accepted: true,
        serverTime: Date.now(),
        profile: payload || null,
      });
    });

    socket.on(BackendEvents.POWERUP_COLLECT_REQUEST, ({ powerUpId }: { powerUpId: string }) => {
      const index = powerUps.findIndex(p => p.id === powerUpId);
      if (index !== -1) {
        const powerUp = powerUps[index];
        powerUps.splice(index, 1);
        io.emit(BackendEvents.POWERUP_COLLECTED, { id: powerUpId, type: powerUp.type, playerId: socket.id });
      }
    });

    socket.on(BackendEvents.PLAYER_MOVE_UPDATE, (data: { position: [number, number, number], rotation: number, isCrouching?: boolean, isJumping?: boolean }) => {
      if (players[socket.id]) {
        players[socket.id].position = data.position;
        players[socket.id].rotation = data.rotation;
      }
    });

    socket.on(BackendEvents.PLAYER_SHOOT, () => {
      // Mapping layer hook for authoritative shot validation / telemetry.
    });

    socket.on(BackendEvents.PLAYER_HIT_REPORT, (payload) => {
      if (payload?.targetId) {
        socket.emit('hitPlayer', payload.targetId);
      }
    });
    socket.on('disconnect', () => {
      if (players[socket.id]) {
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
        io.emit(BackendEvents.PLAYER_LEFT, socket.id);
      }
    });
  });


  app.post('/api/profile', (req, res) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().slice(0, 24) : '';
    res.json({ ok: true, username: username || 'OPERATOR' });
  });

  app.post('/api/settings', (req, res) => {
    const sensitivity = typeof req.body?.sensitivity === 'number' ? req.body.sensitivity : undefined;
    const signalColor = typeof req.body?.signalColor === 'string' ? req.body.signalColor : undefined;
    res.json({ ok: true, sensitivity, signalColor });
  });

  app.post('/api/match/end', (req, res) => {
    res.json({ ok: true, receivedAt: Date.now(), summary: req.body || {} });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();