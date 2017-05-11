/* globals clients: false, server: false */
/* exported RotateTvChannel */ 

var $ = document.getElementById.bind(document);
var tv = $('tv');
var currentTexture = 0;
var TV_TEXTURES = [
    {title: 'Taco Time', url: 'giphy.gif'},
    {title: 'oh my gosh', url: 'https://media.giphy.com/media/654unty0gaFji/giphy.gif'},
    {title: 'Dance Dance', url: 'https://media.giphy.com/media/rfO3oUA6x5ZRe/giphy.gif'}, 
    {title: 'Burger Time', url: 'https://media.giphy.com/media/l2SpNLZQSlENDKAkU/giphy.gif'},
];

var SetTvChannel = clients.open(function SetTvChannel(index, url, title) {
    tv.setTextureSrc(1, url);
    currentTexture = index;
    console.log("Changed to channel", currentTexture, title);

    // create a new sign element and spawn it into the world
    var html = '<sign><text bgcolor="#fff" color="#8d8">' + title + '</text></sign>';
    var notif = document.createElementFromString(html);
    var remoteSign = $('tv-remote');
    notif.position = remoteSign.position;
    notif.rotation = remoteSign.rotation;
    notif.position.y += 2;
    document.body.appendChild(notif);

    setTimeout(function hideNotif() {
        console.log("hide the notif");
        notif.parentNode.removeChild(notif);
    }, 1500);
});

var _RotateOnServer = server.open({
    maxRate: 1
}, function _RotateOnServer(clientsTexture) {
    console.log("Hello on the server!; clientsTexture=", clientsTexture);

    currentTexture = (currentTexture + 1) % TV_TEXTURES.length;
    var info = TV_TEXTURES[currentTexture];

    console.log('SetTvChannel=', SetTvChannel);

    // execute rpc
    SetTvChannel(currentTexture, info.url, info.title);
});

function RotateTvChannel() {
    // just let the server do it
    _RotateOnServer(currentTexture);
}

server.on('ready', function() {
    // NB: this will run on the server, so we can get clients
    //  events like `join`:
    clients.on('join', function(client) {
        console.log("Got a client! Setting their TV Channel");

        var info = TV_TEXTURES[currentTexture];

        // execute rpc directly on the client (the server can do this!)
        client.run('SetTvChannel', currentTexture, info.url, info.title);
    });
});
