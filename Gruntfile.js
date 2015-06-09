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
        },
        concat: {
            options: {
                banner: "//! Built on <%= grunt.template.today('yyyy-mm-dd') %>\n" +
                    "//! GPL License. www.openmicroscopy.org",
                process: true
            },
            dist: {
                src:  [ "<banner>" ].concat(sources),
                dest: "dist/js/shape-editor.js"
            }
        }
    });

    // Load tasks
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Register tasks
    grunt.registerTask('default', [
        'clean'
    ]);

};