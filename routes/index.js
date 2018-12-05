module.exports = function (app, addon) {

    function getHTTPClient (clientKey, userKey){
        return addon.httpClient({
            clientKey : clientKey,
            userKey   : userKey,
            appKey    : addon.key
        });
    }

    // Root route. This route will serve the `atlassian-connect.json` unless the
    // documentation url inside `atlassian-connect.json` is set
    app.get('/', function (req, res) {
        res.format({
            // If the request content-type is text-html, it will decide which to serve up
            'text/html': function () {
                res.redirect('/atlassian-connect.json');
            },
            // This logic is here to make sure that the `atlassian-connect.json` is always
            // served up when requested by the host
            'application/json': function () {
                res.redirect('/atlassian-connect.json');
            }
        });
    });

    // Add any additional route handlers you need for views or REST resources here...
    // Render the background-color macro.
    app.get('/v1/backgroundColor', addon.authenticate(), function (req, res) {

        //  Grab all input parameters - sent through to us as query params.
        var color = req.query['color'],
            pageId = req.query['pageId'],
            pageVersion = req.query['pageVersion'],
            macroHash = req.query['macroHash'],
            userKey = req.query['user_key'];
        var clientKey = req.context.clientKey;

        //  Execute API request to get the macro body.
        getHTTPClient(clientKey, userKey).get(
            '/rest/api/content/' + pageId +
            '/history/' + pageVersion +
            '/macro/hash/' + macroHash,
            function (err, response, contents) {

                //  If we've encountered errors, render an error screen.
                if (err || (response.statusCode < 200 || response.statusCode > 299)) {
                    console.log(err);
                    res.render('<strong>An error has occurred :( ' + response.statusCode + '</strong>');
                }

                //  Parse the response, and send the body through.
                contents = JSON.parse(contents);

                console.log('Contents', contents);


                //  Render with required body.
                res.render('background-color', { body: contents.body, color: color });

            }
        );

    });


    // load any additional files you have in routes and apply those to the app
    {
        var fs = require('fs');
        var path = require('path');
        var files = fs.readdirSync("routes");
        for (var index in files) {
            var file = files[index];
            if (file === "index.js") continue;
            // skip non-javascript files
            if (path.extname(file) != ".js") continue;

            var routes = require("./" + path.basename(file));

            if (typeof routes === "function") {
                routes(app, addon);
            }
        }
    }
};
