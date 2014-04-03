module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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

  // Default task(s).
  grunt.registerTask('default', ['watch']);

};