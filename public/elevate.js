/* globals clients: false, server: false */
/* exported Elevate, Lower */ 

var ELEVATE_SPEED = 0.05;
var ELEVATE_AMOUNT = 24;
var FPS = 60;
var INTERVAL = 1000 / FPS;

var courtyard = document.getElementById('courtyard');
var defaultCourtyardY = courtyard.position.y;
var top = defaultCourtyardY + ELEVATE_AMOUNT;

var PositionCourtyard = clients.open({
    maxRate: FPS + 5 // fudge it
}, function PositionCourtyard(y) {
    courtyard.position.y = y;
});

var Elevate = server.open(function Elevate() {
    clearInterval(courtyard._interval);
    courtyard._interval = setInterval(function() {
        courtyard.position.y += ELEVATE_SPEED;
        if (courtyard.position.y >= top) {
            clearInterval(courtyard._interval);
            courtyard.position.y = top;
        }

        PositionCourtyard(courtyard.position.y);
    }, INTERVAL);
});

var Lower = server.open(function Lower() {
    clearInterval(courtyard._interval);
    courtyard._interval = setInterval(function() {
        courtyard.position.y -= ELEVATE_SPEED;
        if (courtyard.position.y <= defaultCourtyardY) {
            clearInterval(courtyard._interval);
            courtyard.position.y = defaultCourtyardY;
        }

        PositionCourtyard(courtyard.position.y);
    }, INTERVAL);
});

server.on('ready', function() {
    clients.on('join', function(client) {
        client.run('PositionCourtyard', courtyard.position.y);
    });
});
