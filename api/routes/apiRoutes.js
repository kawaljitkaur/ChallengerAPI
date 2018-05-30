'use strict';
module.exports = function (app) {
    var controller = require('../controllers/uploadController');

    // todoList Routes
    app.route('/test')
        .get(controller.test);

    app.route('/upload')
        .post(controller.add_new_version);

    app.route('/getLatest')
        .get(controller.get_latest_version);
    app.route('/download')
        .get(controller.fetch_latest_setup);
    app.route('/checkForUpdates')
        .get(controller.check_for_updates);

};