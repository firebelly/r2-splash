/**
 * Asset gulpin'
 * compiles SCSS, js, sourcemaps, svgs into defs file, etc
 *
 * npx gulp watch = monitor changes for development
 * npx gulp --production = compile assets and asset manifest for production
 */

var gulp         = require('gulp');
var gulpif       = require('gulp-if');
var sass         = require('gulp-sass');
var concat       = require('gulp-concat');
var uglify       = require('gulp-uglify');
var autoprefixer = require('gulp-autoprefixer');
var cssnano      = require('gulp-cssnano');
var include      = require('gulp-include');
var rev          = require('gulp-rev');
var revRewrite   = require('gulp-rev-rewrite');
var sourcemaps   = require('gulp-sourcemaps');
var runSequence  = require('run-sequence');
var argv         = require('minimist')(process.argv.slice(2));
var notify       = require('gulp-notify');
var svgstore     = require('gulp-svgstore');
var svgmin       = require('gulp-svgmin');
var rename       = require('gulp-rename');
var browserSync  = require('browser-sync').create();
var isProduction = argv.production;

// Various config
var opt = {
  siteUrl: 'r2-splash.localhost',
  distFolder: 'dist'
};

// SVGs to defs
gulp.task('svgs', function() {
  return gulp.src('assets/svgs/*.svg')
    .pipe(svgmin({
        plugins: [
        { removeViewBox: false },
        { removeEmptyAttrs: false },
        { mergePaths: false },
        { removeAttrs: {
            attrs: ['stroke', 'fill-rule']
          }
        },
        { cleanupIDs: false }]
    }))
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename({suffix: '-defs'}))
    .pipe(gulp.dest(opt.distFolder));
});

// smash CSS!
gulp.task('styles', function() {
  return gulp.src([
      'assets/sass/main.scss'
    ])
    .pipe(sass())
    .on('error', notify.onError(function (error) {
       return 'Style smash error!' + error;
    }))
    .pipe(autoprefixer())
    .pipe(gulpif(isProduction, cssnano()))
    .pipe(gulp.dest(opt.distFolder + '/css'))
    .pipe(browserSync.stream());
    // .pipe(notify({message: 'Styles smashed.', onLast: true}));
});

// smash javascript!
gulp.task('scripts', function() {
  return gulp.src([
      'assets/js/main.js'
    ])
    .pipe(include())
    .pipe(gulpif(!isProduction, sourcemaps.init()))
    .pipe(uglify())
    .on('error', notify.onError(function (error) {
       return 'Script smash error!' + error;
    }))
    .pipe(gulp.dest(opt.distFolder + '/js'))
    .pipe(gulpif(!isProduction, sourcemaps.write('maps')))
    .pipe(gulpif(!isProduction, gulp.dest(opt.distFolder + '/js')))
    .pipe(notify({message: 'Scripts smashed.', onLast: true}));
});

// revision files for production assets
gulp.task('rev', function() {
  return gulp.src([opt.distFolder + '/**/*.css', opt.distFolder + '/**/*.js'])
    .pipe(rev())
    .pipe(gulp.dest(opt.distFolder))
    .pipe(rev.manifest())
    .pipe(gulp.dest(opt.distFolder));
});

// rewrite index w/ revisioned filenames
gulp.task('revrewrite', ['rev'], function() {
  var manifest = gulp.src(opt.distFolder + '/rev-manifest.json');

  return gulp.src('index.html')
    .pipe(revRewrite({ manifest: manifest }))
    .pipe(gulp.dest(opt.distFolder));
});

// folders to watch for changes
gulp.task('watch', ['build'], function() {
  browserSync.init({
    proxy: opt.siteUrl,
    files: ['*.html'],
    notify: false,
    open: false
  });

  gulp.watch('assets/sass/*.scss', ['styles']);
  gulp.watch('assets/sass/**/*.scss', ['styles']);
  gulp.watch('assets/js/*.js', ['scripts']);
  gulp.watch('assets/js/**/*.js', ['scripts']);
  gulp.watch('assets/svgs/*.svg', ['svgs']);
  gulp.watch('assets/images/*', ['copy']);
  gulp.watch('*.html', ['copy']);
});

// Copy various files/dirs to dist
gulp.task('copy', function() {
  gulp.src(['assets/js/modernizr.custom.js'])
    .pipe(gulp.dest(opt.distFolder + '/js/'));
  gulp.src(['assets/images/*'])
    .pipe(gulp.dest(opt.distFolder + '/images/'));
  gulp.src(['assets/svgs/*'])
    .pipe(gulp.dest(opt.distFolder + '/svgs/'));
  // Copy index.html to dist for development
  if (!isProduction) {
    gulp.src(['index.html'])
      .pipe(gulp.dest(opt.distFolder + '/'));
  }
  return gulp.src(['assets/fonts/*'])
    .pipe(gulp.dest(opt.distFolder + '/fonts/'));
});

// `gulp clean` - Deletes the build folder entirely.
gulp.task('clean', require('del').bind(null, [opt.distFolder]));

// `gulp build` - Run all the build tasks but don't clean up beforehand.
gulp.task('build', function(callback) {
  if (isProduction) {
    // production gulpin' (with revisions)
    runSequence(
      'clean',
      ['copy', 'styles', 'scripts', 'svgs'],
      'revrewrite',
      callback
    );
  } else {
    // dev gulpin'
    runSequence(
      'clean',
      ['copy', 'styles', 'scripts', 'svgs'],
      callback
    );
  }
});

// `gulp` - Run a complete build. To compile for production run `gulp --production`.
gulp.task('default', function() {
  gulp.start('build');
});
