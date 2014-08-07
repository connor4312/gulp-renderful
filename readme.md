# Deprecated

At the time I wrote this, I wasn't aware that EJS had added `includes` and other more advanced features itself several versions ago. I recommend using [gulp-ejs](https://github.com/rogeriopvl/gulp-ejs) instead of this!

# gulp-renderful

This package is designed to make the building of static sites easier and more enjoyable. Rather than using ugly PHP `includes`, you can now use EJS templating (or whatever else you like) backed by Express to render HTML. This allows you to, for example, include view partials with `<%- include somepartial.ejs %>`.

## Example

```js
gulp.task('html', function() {
    gulp.src('src/*.html')
        .pipe(require('../gulp-renderful')())
        .pipe(gulp.dest('./dist'));
});
```

## Options: renderful([options])

### engine

Type: `object` Default: `require('ejs').renderFile`

Allows you to pass your own rendering engine in, to use instead of EJS.

### extensions

Type: `array` Default: `[]`

When a non-empty array, only files with these extensions will be processed. For more capabilities (e.g. globbing), you can take a look at [gulp-if](https://github.com/robrich/gulp-if).

### data

Type: `object` Default: `{}`

Data to be passed into the views.



