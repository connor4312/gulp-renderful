var gutil   = require('gulp-util'),
    express = require('express'),
    path    = require('path'),
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

    var self     = null,
        files    = [],
        filePath = path.join(path.resolve(__dirname), '.tmp'),
        exts     = [],
        timeout  = null;

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

    var transform = new require('stream').Transform({ objectMode: true });

    transform._transform = function (file, encoding, callback) {
        if (file.isNull()) {
            return callback();
        }

        if (file.isStream()) {
            this.emit('error', new PluginError('gulp-renderful',  'Streaming not supported'));
            return callback();
        }

        var viewpath = path.relative('./', file.path).replace('..' + path.sep),
            fullpath = path.join(filePath, viewpath),
            ext      = path.extname(file.path);

        fs.mkdirs(path.dirname(fullpath), function () {
            file.pipe(fs.createWriteStream(fullpath))
                .on('end', callback);
        });

        if (!opt.extensions.length || exts.indexOf(ext) !== -1) {
            registerExtension(ext);
        }

        file.viewpath = viewpath;
        files.push(file);
    }

    transform._flush = function (callback) {
        var self = this;

        async.each(files, function (file, callback) {

            var ext = path.extname(file.path);

            if (opt.extensions.length && opt.extensions.indexOf(ext) === -1) {
                self.emit(file);
                callback();
                return;
            }

            app.render(file.viewpath, opt.data, function (err, html) {
                if (err) {
                    return callback(err);
                }

                file.contents = new Buffer(html, 'utf8');
                self.push(file);

                callback();
            });

        }, function (err) {
            if (err) {
                self.emit('error', new PluginError('gulp-renderful',  err));
            }

            fs.remove(filePath);
            return callback();
        });
    }

    return transform;
};
