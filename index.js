var imageToAscii = require('image-to-ascii');
var spawn = require('child_process').spawn;
var fs = require('fs');
var net = require('net');
var http = require('http');
var url = require('url');
var socketio = require('socket.io');

var app = http.createServer((req, res) => {
  var parsedReq = url.parse(req.url);
  console.log(parsedReq.path);
  if (parsedReq.path === '/' || parsedReq.path === '/index.html') {
    res.end(fs.readFileSync('index.html'), () => { });
  } else if (parsedReq.path === '/client.js') {
    res.end(fs.readFileSync('client.js'), () => { });
  }
}).listen(8080);

var io = socketio(app);

io.on('connection', (socket) => {
  asciiGenerator(socket);
});

function asciiGenerator (sock) {
  var raspivid = spawn('raspivid', [ '-w', '50', '-h', '50', '-n', '-t', '0', '-o', '-' ]);
  var ffmpeg = spawn('ffmpeg', [ '-i', '-', '-r', '2', '-update', '1', '-f', 'image2', '-']);
  
  ffmpeg.stdout.on('data', (data) => {
    var file = new Buffer(data);
    imageToAscii(file, {
      colored: false,
      size: {
        width: 30
      }
    }, (err, converted) => {
        if (err) {
          console.log(err);
        } else {
          sock.emit('data', { data: converted });
        }
    });
  });
  
  ffmpeg.stderr.on('data', (data) => {
    //console.log(`ffmpeg stderr: ${data}`);
  });
  
  ffmpeg.on('close', (code) => {
    if (code !== 0) {
      console.log(`ffmpeg process exited with code ${code}`);
    }
  });
  
  raspivid.stdout.on('data', (data) => {
    ffmpeg.stdin.write(data);
  });
  
  raspivid.stderr.on('data', (data) => {
    //console.log(`raspivid stderr: ${data}`);
  });
  
  raspivid.on('close', (code) => {
    if (code !== 0) {
      console.log(`raspivid process exited with code ${code}`);
    }
  
    ffmpeg.stdin.end();
  });

}
