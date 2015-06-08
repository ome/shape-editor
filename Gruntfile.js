'use strict';
module.exports = function(grunt) {

    grunt.initConfig({
        clean: {
            dist: [
                'index.html',
                'dist/css',
                'dist/js/*.js'
            ]
        }
    });

    // Load tasks
    grunt.loadNpmTasks('grunt-contrib-clean');

    // Register tasks
    grunt.registerTask('default', [
        'clean'
    ]);

};