/* jshint node: true */

module.exports = function(grunt) {

    grunt.initConfig({
        clean: {
            dist: [
                'index.html',
                'dist/css',
                'dist/js/*.js'
            ]
        },
        jshint: {
            all: [
                "Gruntfile.js",
                "src/js/*.js"
            ],
            options: {
              jshintrc: '.jshintrc'
            }
        }
    });

    // Load tasks
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // Register tasks
    grunt.registerTask('default', [
        'clean'
    ]);

};