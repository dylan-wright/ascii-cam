var socket = io('192.168.0.12:8080');
socket.on('connect', () => {
  socket.on('data', (msg) => {
    console.log(msg);
    document.getElementById('disp').innerHTML = msg.data;
  });
});
