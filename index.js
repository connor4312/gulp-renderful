var gutil   = require('gulp-util'),
    express = require('express'),
    path    = require('path'),
    through = require('through'),
    fs      = require('fs-extra'),
    async   = require('async'),
    app     = express(),
    File    = gutil.File,
    PluginError = gutil.PluginError;

module.exports = function(fileName, opt) {

    opt            = opt            || {};
    opt.engine     = opt.engine     || require('ejs').renderFile;
    opt.extensions = opt.extensions || [];
    opt.data       = opt.data       || {};

    var files    = [],
        filePath = path.join(path.resolve(__dirname), '.tmp'),
        exts     = [];

    app.engine('ejs', opt.engine);
    app.set('view engine', 'ejs');
    app.set('views', filePath);

    function registerExtension(ext) {
        app.engine(ext.substring(1), opt.engine);
        exts.push(ext);
    }

    for (var i = 0, l = opt.extensions.length; i < l; i++) {
        registerExtension(opt.extensions[i]);
    }

    function store(file) {
        if (file.isNull()) {
            return;
        }

        if (file.isStream()) {
            return this.emit('error', new PluginError('gulp-renderful',  'Streaming not supported'));
        }

        var p      = path.join(filePath, file.path),
            ext    = path.extname(file.path);

        fs.mkdirs(path.dirname(p), function () {
            file.pipe(fs.createWriteStream(p));
        });

        if (!opt.extensions.length || exts.indexOf(ext) !== -1) {
            registerExtension(ext);
        }

        files.push(file);
    }

    function render() {

        var self = this;

        async.each(files, function (file, callback) {

            var ext = path.extname(file.path);

            if (opt.extensions.length && opt.extensions.indexOf(ext) === -1) {
                self.emit(file);
                callback();
                return;
            }

            app.render(file.path, opt.data, function (err, html) {
                if (err) {
                    return callback(err);
                }

                file.contents = new Buffer(html);
                self.push(file);

                callback();
            });

        }, function (err) {
            if (err) {
                self.emit('error', new PluginError('gulp-renderful',  err));
            }

            fs.remove(filePath);
        });
    }

    return through(store, render);
};