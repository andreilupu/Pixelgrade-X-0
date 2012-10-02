requirejs.config({

    shim: {
        'jquery.colorize': {
            deps: ['jquery'],
            exports: 'jQuery.fn.colorize'
        },
        'jquery.scroll': {
            deps: ['jquery'],
            exports: 'jQuery.fn.scroll'
        },
        'backbone.layoutmanager': {
            deps: ['backbone']
            exports: 'Backbone.LayoutManager'
        }
    }
    
    //By default load any module IDs from js/lib
    baseUrl: 'lib/js',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        angular: '../js/angular'
    }
});

// Start the main app logic.
requirejs(['angular/app', 'angular/controllers', 'angular/directives', 'angular/filters', 'angular/services' ]);