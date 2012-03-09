/**
 * Template data
 */
function index(callback, data) {
    setTimeout(function(){
        callback(null, data);
    }, 1000);
}

function nasty_level2(callback, data) {
    setTimeout(function(){
        callback(null, {
            items: [
                'nasty_level3',
                'nasty_level3',
                'nasty_level3',
                'nasty_level3',
                'nasty_level3'
            ]
        });
    }, Math.floor(Math.random()*3000));
}

function nasty_level3(callback, data) {
    setTimeout(function(){
        callback(null, data);
    }, Math.floor(Math.random()*3000));
}

module.exports = {
    index: index,
    nasty_level2: nasty_level2,
    nasty_level3: nasty_level3
};
