module.exports = function(grunt) {
  require('time-grunt')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    banner: '/*! <%= pkg.longName %> v<%= pkg.version %> by <%= pkg.author.name %>\n' +
            ' * Source available at <%= pkg.homepage %> */',

    html_banner:  '<!--\n' + ' <%= pkg.longName %> v<%= pkg.version %> by <%= pkg.author.name %>\n' +
                  ' Source available at <%= pkg.homepage %>\n' + '-->',

    usebanner: {
      deploy: {
        options: {
          position: 'bottom',
          banner: '<%= html_banner %>',
          linebreak: true
        },
        files: {
          src: ['build/*.html']
        }
      }
    },

    jshint: {
      files: ['src/js/*.js', 'src/js/**/*.js', '!src/js/libs/*'],
      options: {
        expr: true,
        globals: {
          jQuery: false,
          console: true,
          module: true
        }
      }
    },

    imagemin: {
      icons: {
        files: [{
          expand: true,
          cwd: 'src/images/',
          src: '*.png',
          dest: 'build/images/'
        }]
      }
    },

    copy: {
      deploy: {
        files: [
          {expand: true, flatten: true, src: ['src/*.html'], dest: 'build/'},
          {expand: true, flatten: true, src: ['src/manifest.json'], dest: 'build/'},
          {expand: true, flatten: true, src: ['src/js/libs/*'], dest: 'build/js/libs/'}
        ]
      }
    },

    sass: {
      options: {
        style: 'expanded',
        precision: 4
      },
      develop: {
        files: [
          {src: ['src/scss/popup.scss'], dest: 'build/css/popup.css'},
          {src: ['src/scss/settings.scss'], dest: 'build/css/settings.css'}
        ]
      },
      deploy: {
        files: [
          {src: ['src/scss/popup.scss'], dest: 'src/temp/popup.css'},
          {src: ['src/scss/settings.scss'], dest: 'src/temp/settings.css'}
        ]
      }
    },

    cssmin: {
      options: {
        report: 'min',
        banner: '<%= banner %>\n'
      },
      deploy: {
        expand: true,
        flatten: true,
        src: 'src/temp/*.css',
        dest: 'build/css/'
      }
    },

    concat: {
      develop: {
        files: {
          // Destination file
          'build/js/core.js':
          [ // Source files
            'src/js/core/common.js',
            'src/js/core/main.js',
            'src/js/core/context-menus.js'
          ],
          // Destination file
          'build/js/popup.js':
          [ // Source files
            'src/js/core/common.js',
            'src/js/popup.js'
          ],
          // Destination file
          'build/js/settings.js':
          [ // Source files
            'src/js/core/common.js',
            'src/js/settings.js'
          ]
        }
      },
      deploy: {
        files: {
          // Destination file
          'src/temp/core.js':
          [ // Source files
            'src/js/core/common.js',
            'src/js/core/main.js',
            'src/js/core/context-menus.js'
          ],
          // Destination file
          'src/temp/popup.js':
          [ // Source files
            'src/js/core/common.js',
            'src/js/popup.js'
          ],
          // Destination file
          'src/temp/settings.js':
          [ // Source files
            'src/js/core/common.js',
            'src/js/settings.js'
          ]
        }
      }
    },

    uglify: {
      options: {
        report: 'min',
        mangle: false,
        banner: '<%= banner %>\n\n'
      },
      deploy: {
        expand: true,
        flatten: true,
        src: 'src/temp/*.js',
        dest: 'build/js/'
      }
    },

    clean: {
      tmp: 'src/temp',
      build: 'build'
    },

    compress: {
      deploy: {
        options: {
          archive: 'releases/<%= pkg.name %>.<%= pkg.version %>.zip',
          mode: 'zip'
        },
        files: [{
          expand: true,
          cwd: 'build',
          src: ['**/*']
        }]
      }
    },

    watch: {
      js: {
        files: ['src/js/*', 'src/js/**/*'],
        tasks: ['concat:develop'],
        options: {
          spawn: false
        }
      },
      css: {
        files: ['src/scss/*'],
        tasks: ['sass:develop'],
        options: {
          spawn: false
        }
      },
      html: {
        files: ['src/popup.html', 'src/settings.html'],
        tasks: ['copy'],
        options: {
          spawn: false
        }
      }
    }


  });

  // Load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // Default tasks.
  grunt.registerTask('default', ['jshint', 'copy', 'sass:develop', 'concat:develop']);

  // Build tasks.
  grunt.registerTask('deploy', ['clean:build', 'imagemin', 'copy', 'sass:deploy', 'cssmin', 'concat:deploy', 'uglify', 'usebanner', 'compress', 'clean:tmp']);

};