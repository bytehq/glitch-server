const fs = require('fs');
const path = require('path');
const url = require('url');

/*
 *  Important environment variables.
 */
const coprManagerServerAddress = process.env.COPR_MANAGER_SERVER_ADDRESS || 'localhost:50051';

/*
 *  Only set/tweak these if you really need to
 */
const publicAddress = process.env.PROJECT_NAME !== undefined ? 'https://' + process.env.PROJECT_NAME + '.glitch.me' : 'http://localhost';
const publicPort = process.env.PUBLIC_PORT || 80;
const localPort = process.env.PORT || 3000;

/*
 * Interspace Server (for COPR communication)
 */
const InterspaceServer = require('interspace-http-server-module');
var interspaceServer;

/*
 *  Restify (static file server)
 */
const restify = require('restify');
const restifyEtagCache = require('restify-etag-cache');
var server = restify.createServer({
    formatters: {
        'text/html': function(req, res, body, cb) {
            cb(
                null,
                'This URL is hosting an Interspace planet. Please download an Interspace browser to view it.'
            );
        }
    }
});
server.use(restifyEtagCache({
    'weak': false
}));
server.use(restify.conditionalRequest());

/*
 *  World State
 */

var cdnDirectory = null;

function initialiseCDNDirectory() {
    let content = fs.readFileSync('.glitch-assets', 'utf8');
    let files = content.split('\n');
    for (var i = 0; i < files.length; i++) {
        if (cdnDirectory !== null) break;
        let file = files[i];
        if (file.includes('cdn.glitch.com')) {
            let fileParsed = JSON.parse(file);
            let urlComponents = fileParsed.url.split('%2F');
            cdnDirectory = urlComponents[0];
        }
    }
}

/*
 *  HTTP Request Handler
 */
server.get(/.*/, function(req, res, next) {
    var publicDir = __dirname + '/public';

    // Check for Interspace room name
    var parts = url.parse(req.url);
    var room = parts.pathname;
    if (!room || room.length < 2) {
        room = '/index.iml';
    }

    // Default static serve if the proper headers aren't supplied
    if (req.header('Accept').split(',').indexOf('application/interspace') == -1) {
        let cb = restify.serveStatic({
            'directory': publicDir,
            'max-Age': 604800 // 1 week
        });

        if (['.iml', '.xml', '.js'].indexOf(path.extname(room)) < 0) {
            let target = cdnDirectory.replace('https://', 'http://') + room;
            res.redirect(target, next);
        } else {
            cb(req, res, next);
        }

        cb(req, res, next);
        return;
    }

    let cb = restify.serveStatic({
        'directory': publicDir,
        'default': 'index.iml',
        'max-Age': 604800 // 1 week
    });

    // Serve static files without X-Interspace headers
    if (['.iml', '.xml', '.js'].indexOf(path.extname(room)) < 0) {
        let target = cdnDirectory.replace('https://', 'http://') + room;
        res.redirect(target, next);
        return;
    }

    if (['.iml', '.xml'].indexOf(path.extname(room)) < 0) {
        console.log('Serving: ' + room);
        cb(req, res, next);
        return;
    } else {
        fs.access(path.join(publicDir, room), function(err) {
            if (err && err.code === 'ENOENT') {
                let target = req.url.replace('.iml', '.xml');
                res.redirect(target, next);
                return;
            } else {
                getCOPRServer();
            }
        });
    }

    function getCOPRServer() {
        // Fetch COPR headers from COPR Manager and return
        interspaceServer.getCOPRServer(room, function(err, response) {
            if (err !== null) {
                console.error('COPR Header request failed: ' + err);
                return;
            }
            interspaceServer.initialiseWorldState(room, function(err) {
                if (err !== null) {
                    console.error('Initialising world state failed:' + err);
                    return;
                }

                // Set X-Interspace headers
                res.header('X-Interspace-COPR-Room', room);
                res.header('X-Interspace-COPR-Address', response.coprAddress);
                res.header('X-Interspace-COPR-UUID', response.uuid);

                cb(req, res, next);
            });
        });
    }
});

/*
 * Start HTTP and Interspace servers
 */
function main() {
    initialiseCDNDirectory();

    interspaceServer = new InterspaceServer({
        'server': server,
        'coprAddress': coprManagerServerAddress,
        'localAddress': publicAddress,
        'localPort': publicPort,
        'staticPath': __dirname
    });

    server.listen(localPort, function() {
        console.log('listening at %s', server.url);

        process.on('SIGINT', function() {
            interspaceServer.shutdown();
            process.exit();
        });
    });
}

main();