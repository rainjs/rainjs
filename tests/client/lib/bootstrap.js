require.config({
    "debug": ('{{server.env}}' == 'production'? 'false' : 'true'),
    "baseUrl": "/",
    "packages": [{
        "name": "raintime",
        "main": "raintime",
        "location": "core/js"
    }],
    "priority": ["raintime"]
});
