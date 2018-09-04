var gulp =  require('gulp');

var sass = require('gulp-ruby-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var px2rem = require('gulp-px3rem');

var eslint = require('gulp-eslint');

var htmlone = require('gulp-htmlone');

var rename = require('gulp-rename');
var del = require('del');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var gulpify = require('gulpify');
var sassdoc = require('sassdoc');


var paths = {
  src: './src',
  build: './build'
};

// using gulpify:
gulp.task('gulpify', function() {
  gulp.src('index.js')
    .pipe(gulpify())
    .pipe(uglify())
    .pipe(rename('bundle.js'))
    .pipe(gulp.dest('./'))
})

// using vinyl-source-stream:
gulp.task('browserify', function() {
  var bundleStream = browserify('./index.js').bundle()

  bundleStream
    .pipe(source('index.js'))
    .pipe(streamify(uglify()))
    .pipe(rename('bundle.js'))
    .pipe(gulp.dest('./'))
})
// css
gulp.task('sass', function () {
  return sass(paths.src + '/**/*.scss')
    .on('error', sass.logError)
    .pipe(gulp.dest(paths.build + '/css/'));
});

gulp.task('css', ['sass'], function () {
  return gulp.src(paths.src + '/**/*.css', {base: paths.src})
    .pipe(px2rem({
      threeVersion: false,
      // XXX: 以下两项根据项目实际情况做修改
      remUnit: 75,
      baseDpr: 2,
      forcePxComment: 'px',
      keepComment: 'no'
    }))
    // px3rem 默认输出的文件带有 .debug 后缀
    .pipe(rename(function (path) {
      path.basename = path.basename.replace('.debug', '');
    }))
    .pipe(postcss([
      // 自动添加厂商前缀
      autoprefixer({
        browsers: ['> 1%', 'last 2 versions']
      })
    ]))
    .pipe(gulp.dest(paths.src));
});

// js
gulp.task('eslint', function () {
  return gulp.src(paths.src + '/js/**/*.js', {base: paths.src})
    .pipe(eslint())
    .pipe(eslint.format())
    // 如果 eslint 有 error 则报错，不执行后续操作
    .pipe(eslint.failAfterError());
});

// combo
// 1. htmlone 集成了 uglify-js 和 ycssmin 插件，所以不需要额外的 minify 方案
gulp.task('htmlone', ['css', 'eslint'], function () {
  // 先保存一个未压缩版
  gulp.src(paths.src + '/**/*.html', {base: paths.src})
    .pipe(htmlone({
      cssminify: false,
      jsminify: false
    }))
    .pipe(rename({
      suffix: '.debug'
    }))
    .pipe(gulp.dest(paths.build));

  // 再保存一个压缩版
  return gulp.src(paths.src + '/**/*.html', {base: paths.src})
    .pipe(htmlone({
      cssminify: true,
      jsminify: true
    }))
    .pipe(gulp.dest(paths.build));
});

// clean
gulp.task('clean', function () {
  del(paths.build);
});

gulp.task('sassdoc', function () {
  var options = {
    dest: 'docs',
    verbose: true,
    display: {
      access: ['public', 'private'],
      alias: true,
      watermark: true,
    },
    // groups: {
    //   'undefined': 'Ungrouped',
    //   foo: 'Foo group',
    //   bar: 'Bar group',
    // },
    basePath: 'https://github.com/W3cplus/SassMagic/blob/master/src',
  };

  return gulp.src('src/**/*.scss')
    .pipe(sassdoc(options));
});

gulp.task('watch', ['default'], function () {
  //gulp.watch([paths.src + '/js/*.js'], ['eslint']);
  gulp.watch([paths.src + '/**/*.scss'], ['css']);
});

gulp.task('build', ['clean', 'sass', 'css', 'eslint', 'htmlone','sassdoc']);
gulp.task('default', ['build']);

