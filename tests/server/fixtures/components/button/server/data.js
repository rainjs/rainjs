/**
 * Template data
 */
function index(callback, data) {
    callback(null, data);
}

function nasty_level2(callback, data) {
    setTimeout(function(){
        callback(null, data);
    }, Math.floor(Math.random()*1500));
}

function nasty_level3(callback, data) {
    setTimeout(function(){
        callback(null, {
            old_data: data,
            new_data: 'my_new_data'
        });
    }, Math.floor(Math.random()*3000));
}

function with_customer_error(callback, data){
    callback({
        arrrghhhhhh: "DAMMNNNNNNNNNN"
    }, data);
}

module.exports = {
    index: index,
    nasty_level2: nasty_level2,
    nasty_level3: nasty_level3,
    with_customer_error: with_customer_error
};
