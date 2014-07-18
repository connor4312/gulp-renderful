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

    function store(file) {

        self = this;

        if (file.isNull()) {
            return;
        }

        if (file.isStream()) {
            return this.emit('error', new PluginError('gulp-renderful',  'Streaming not supported'));
        }

        var viewpath = path.relative('./', file.path).replace('..' + path.sep),
            fullpath = path.join(filePath, viewpath),
            ext      = path.extname(file.path);

        fs.mkdirs(path.dirname(fullpath), function () {
            file.pipe(fs.createWriteStream(fullpath));
        });

        if (!opt.extensions.length || exts.indexOf(ext) !== -1) {
            registerExtension(ext);
        }

        file.viewpath = viewpath;
        files.push(file);

        // There's no way to detect when the last file is sent. So, yeah, this sucks, I know.
        clearTimeout(timeout);
        timeout = setTimeout(render, 250);
    }

    function render() {

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

    return through(store);
};
