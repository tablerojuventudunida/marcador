const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Servir archivos estáticos tanto desde la carpeta 'public' como desde la raíz
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

let gameState = {
  homeName: 'LOCAL',
  awayName: 'VISITANTE',
  category: 'CATEGORIA 2014',
  homeScore: 0,
  awayScore: 0,
  seconds: 0,
  period: '1T',
  homeLogo: '',
  awayLogo: '',
  bgUrl: '',
  timerRunning: false
};

let timerInterval = null;

function startServerTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (gameState.timerRunning) {
      gameState.seconds++;
      io.emit('updateState', gameState);
    }
  }, 1000);
}

io.on('connection', (socket) => {
  socket.emit('updateState', gameState);

  socket.on('updateState', (newState) => {
    if (newState.timerRunning !== undefined) {
      gameState.timerRunning = newState.timerRunning;
      if (gameState.timerRunning) {
        startServerTimer();
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }

    Object.assign(gameState, newState);
    io.emit('updateState', gameState);
  });

  // Evento directo para disparar la animación de gol
  socket.on('triggerGoal', (data) => {
    io.emit('triggerGoal', data);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
