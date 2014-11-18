module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      release: [
        "release/**"
      ],
      admin: ["release/admin/**"]
    },
    assemble: {
      release: {
        options: {
          layoutdir: 'src/www/templates/layouts',
          partials: ['src/www/templates/includes/**/*.hbs']
        },
        files: [{
          expand: true,
          flatten: true,
          cwd: 'src',
          src: ['www/templates/pages/**/*.hbs'],
          dest: 'release/admin/www'
        }]
      }
    },
    concat: {
      options: {
        separator: "\n"
      },
      admin: {
        src: [
          'bower_components/jquery/dist/jquery.js',
          'src/www/js/admin.js',
          'src/www/js/admin/*.js'
        ],
        dest: 'release/admin/www/js/admin.js'
      },
      clientbase: {
        src: [
          'src/www/js/honeybadger.js',
          'src/www/js/honeybadger/*.js'
        ],
        dest: 'release/admin/www/js/honeybadger.js'
      },
      css: {
        src: [
          'src/www/css/**.css',
        ],
        dest: 'release/admin/www/css/admin.css'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        beautify: false
      },
      build: {
        files: {
          'release/admin/www/js/honeybadger-min.js': ['release/admin/www/js/honeybadger.js'],
          'release/admin/www/js/admin-min.js': ['release/admin/www/js/admin.js']
        }
      }
    },
    cssmin: {
      combine: {
        files: [{
          expand: true,
          cwd: 'src',
          src: ['www/css/evdp.css'],
          dest: 'release/admin',
          ext: '-min.css'
        }]
      }
    },
    copy: {
      release: {
        files: [{
          expand: true,
          cwd: 'src',
          src: ['data-manager.js'],
          dest: 'release/admin'
        },
        {
          expand: true,
          cwd: 'src',
          src: ['honeybadger.js','data-select.js','config.json','selectors.json','lib/**'],
          dest: 'release'
        }]
      }
    },
    watch: {
      server: {
        files: ['honeybadger.js','lib/*.js'],
        options:{
          livereload: true
        }
      }, 
      js: {
         files: ['www/js/*.js'],
         // tasks: ['uglify'],
         options: {
          livereload: true
         }
      },
      css: {
         files: ['www/css/*.css'],
         // tasks: ['less'],
         options: {
          livereload: true
         }
      },
      html: {
         files: ['www/*.html'],
         options: {
          livereload: true
         }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-newer' );
  grunt.loadNpmTasks('assemble');

  // Default task(s).
  grunt.registerTask('default', ['copy','concat', 'newer:uglify', 'newer:cssmin','newer:assemble']);
  
};