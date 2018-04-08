module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    less: {
      dashboard: {
        files: {
          'public/css/dashboard.css': 'public/css/dashboard.less'
        }
      },
      card: {
        files: {
          'public/card/css/card-list.css': 'public/card/css/card-list.less'
        }
      }
    },

    cssmin: {
      dashboard: {
        files: {
          'public/css/dashboard.custom.min.css': ['public/css/dashboard.css']
        }
      },
      card: {
        files: {
          'public/card/css/card-list.css': ['public/card/css/card-list.css']
        }
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
        livereload: true
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-less')
  grunt.loadNpmTasks('grunt-contrib-cssmin')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-watch')

  grunt.registerTask('cssDashboard', ['less:dashboard', 'cssmin:dashboard'])
  grunt.registerTask('cssCard', ['less:card', 'cssmin:card'])
  grunt.registerTask('css', ['less', 'cssmin'])
  grunt.registerTask('default', ['css', 'uglify'])
}
