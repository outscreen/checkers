var //url = require('url'),
    express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    path = require('path'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    //MongoClient = require('mongodb').MongoClient,
    //ObjectID = require('mongodb').ObjectID,
    gameData,
    maxConnections = 2,
    curConnections = 0;

gameData = {
    white: 'white',
    black: 'black', //are white/black checkers available? at the beginning of the game the both colors are available for players, none is selected by anyone
    whiteMoves: true, //if true, now it is white's turn to move
    checkers: null,
    fields: null,
    reset: function () {
        this.white = 'white';
        this.black = 'black';
        this.whiteMoves = true;
        this.checkers = null;
        this.fields = null;
    }
}

app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.use(bodyParser.json());
//app.use(bodyParser.urlencoded());

app.use(express.static(path.join(__dirname, 'public')));


app.get ('/', function (req, res) {
    res.render('game', function (err, html) {
        res.send(html);
    });
});

app.get ('/getGameInfo', function (req, res) {//assigns a checkers color to a player
    var color = gameData.white || gameData.black; //returns 'white' if white is not occupied (is not null), returns 'black' if white is occupied while black is not, returns false if the both are occupied

    (color == 'white') ? gameData.white = null : gameData.black = null;
    res.send({
        playersColor: color,
        whiteMoves: gameData.whiteMoves,
        fields: gameData.fields,
        checkers: gameData.checkers
    });
});

app.get ('/enemy-disconnected', function (req, res){
    res.send("You won: enemy disconnected");
});

app.get ('/no-slots', function (req, res){
    res.send("Sorry, you need to wait a bit and try again");
});

app.put('/moved', function (req, res) {
    gameData.checkers = req.body['checkers'];
    gameData.fields = req.body['fields'];
    gameData.whiteMoves = !gameData.whiteMoves;


    io.emit('moved');
    res.send();
});


io.on('connection', function(socket){
    curConnections++;
    socket.on('disconnect', function(){
        curConnections--;
        gameData.reset();
        io.emit('enemy disconnected', curConnections);
    });

});


/*
io.on('connection', function(socket){
    socket.on('chat message', function(msg){
        console.log('message: ' + msg);

        io.emit('chat message', msg);
    });
});
*/

http.listen(7777, function () {
    console.log('Chess Server started at 7777.');
});

