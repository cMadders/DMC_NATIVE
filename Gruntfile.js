module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        less: {
            dashboard: {
                files: {
                    "public/css/dashboard.css": "public/css/dashboard.less"
                }
            },
            card: {
                files: {
                    "public/card/css/card-list.css": "public/card/css/card-list.less"
                }
            }
        },


        cssmin: {
            dashboardCore: {
                files: {
                    'public/css/dashboard.core.min.css': ['public/css/core/bootstrap.css', 'public/css/core/font-awesome.min.css', 'public/css/core/animate.css', 'public/css/core/style.css']
                }
            },
            dashboardCustom: {
                files: {
                    'public/css/dashboard.custom.min.css': ['public/css/dashboard.css']
                }
            },
            card: {
                files: {
                    'public/card/css/card-list.css': ['public/card/css/card-list.css']
                }
            },
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
            dashboard: {
                files: {
                    'public/js/dashboard.core.min.js': ['public/js/dashboard.core.js']
                }
            },
            card: {
                files: {
                    'public/card/js/card-list-min.js': ['public/card/js/card-list.js']
                }
            }
        },

        watch: {
            cssDashboard: {
                files: 'public/css/dashboard.less',
                tasks: ['cssDashboard']
            },
            cssCard: {
                files: 'public/card/css/card-list.less',
                tasks: ['cssCard']
            },
            jsCard: {
                files: 'public/card/js/card-list.js',
                tasks: ['uglify:card']
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

    grunt.registerTask('cssDashboard', ['less:dashboard', 'cssmin:dashboardCustom']);
    grunt.registerTask('cssCard', ['less:card', 'cssmin:card']);
    grunt.registerTask('css', ['less', 'cssmin']);
    grunt.registerTask('default', ['css', 'concat', 'uglify']);
};