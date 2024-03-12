let express = require('express');
var app = express();
var http = require('http').createServer(app);

app.use(express.static('src'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/src/index.html');
});

http.listen(process.env.PORT||3000 , () => {
  console.log('listening on *:3000');
});
