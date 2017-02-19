var imageToAscii = require('image-to-ascii');
var spawn = require('child_process').spawn;
var fs = require('fs');

var raspivid = spawn('raspivid', [ '-w', '50', '-h', '50', '-n', '-t', '0', '-o', '-' ]);
var ffmpeg = spawn('ffmpeg', [ '-i', '-', '-r', '1', '-update', '1', '-f', 'image2', '-']);

var currentFile = 1;
var lastFile;

ffmpeg.stdout.on('data', (data) => {
  var file = new Buffer(data);
  imageToAscii(file, {
    colored: true,
    size: {
      width: 30
    }
  }, (err, converted) => {
      if (err) {
        console.log(err);
      } else {
        fs.unlink(file, () => {});
        console.log(converted);
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
