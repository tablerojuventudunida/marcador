const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

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
  // Enviar estado actual al cliente que se acaba de conectar
  socket.emit('updateState', gameState);

  socket.on('updateState', (newState) => {
    // Si cambia el estado del temporizador
    if (newState.timerRunning !== undefined) {
      gameState.timerRunning = newState.timerRunning;
      if (gameState.timerRunning) {
        startServerTimer();
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }

    // Actualizar propiedades manteniendo la referencia del objeto
    Object.assign(gameState, newState);
    
    // Transmitir el estado actualizado a todos los clientes conectados
    io.emit('updateState', gameState);
  });
});

// Asignación dinámica de puerto para Railway o puerto local 3000
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
