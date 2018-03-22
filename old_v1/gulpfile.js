var gulp = require('gulp'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload;

gulp.task('default', function () {
    browserSync.init({
        server: true,
        startPath: "/mob_generator.html"
    })

    gulp.watch(['*.html', 'css/**/*/css', 'js/**/*.js'], { cwd: '.' }, reload); 
});