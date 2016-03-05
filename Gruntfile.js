module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        less: {
            "public/css/dashboard.css": "public/css/dashboard.less",
        },


        cssmin: {
            core: {
                files: {
                    'public/css/dashboard.core.min.css': ['public/css/core/bootstrap.css', 'public/css/core/font-awesome.min.css', 'public/css/core/animate.css', 'public/css/core/style.css']
                }
            },
            custom: {
                files: {
                    'public/css/dashboard.custom.min.css': ['public/css/dashboard.css']
                }
            }
        },

        concat: {
            core: {
                options: {
                    stripBanners: true,
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                        '<%= grunt.template.today("yyyy-mm-dd") %> */',
                },
                src: ['public/js/core/jquery-2.1.1.js', 'public/js/core/bootstrap.min.js', 'public/js/plugins/metisMenu/jquery.metisMenu.js', 'public/js/plugins/slimscroll/jquery.slimscroll.min.js', 'public/js/core/inspinia.js', 'public/js/plugins/pace/pace.min.js', 'public/js/core/sweetalert-min.js'],
                dest: 'public/js/dashboard.core.js'
            }
        },

        uglify: {
            target: {
                files: {
                    'public/js/dashboard.core.min.js': ['public/js/dashboard.core.js']
                }
            }
        },

        watch: {
            less: {
                files: 'public/css/dashboard.less',
                tasks: ['cssDev']
            },
            html: {
                files: 'views/**/*',
                tasks: []
            },
            options: {
                livereload: true,
            },
        },
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('cssDev', ['less', 'cssmin:custom']);
    grunt.registerTask('css', ['less', 'cssmin']);
    grunt.registerTask('default', ['css', 'concat', 'uglify']);
};