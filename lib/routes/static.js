module.exports = {
    name: 'Static files',
    route: \(.*)\g,
    handler: function () {
        console.log('static route called');
    }
}
