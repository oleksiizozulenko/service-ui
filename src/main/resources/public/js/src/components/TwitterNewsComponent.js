/*
 * Copyright 2016 EPAM Systems
 *
 *
 * This file is part of EPAM Report Portal.
 * https://github.com/epam/ReportPortal
 *
 * Report Portal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Report Portal is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Report Portal.  If not, see <http://www.gnu.org/licenses/>.
 */
define(function (require, exports, module) {
    'use strict';

    var $ = require('jquery');
    var Epoxy = require('backbone-epoxy');
    var Util = require('util');

    var TwitterNewsItem = Epoxy.View.extend({
        className: 'post-news-item',
        template: 'tpl-twitter-news-item',
        events: {
        },

        initialize: function() {
            this.render();
        },
        render: function() {
            this.$el.html(Util.templates(this.template, this.options));
        },
    });

    var TwitterNewsComponent = Epoxy.View.extend({
        className: 'post-news-component',
        template: 'tpl-twitter-news-component',
        events: {
        },

        initialize: function() {
            this.render();
            this.update();
        },
        render: function() {
            this.$el.html(Util.templates(this.template, this.options));
        },
        update: function() {
            $.ajax({
                url: '//evbyminsd6293.minsk.epam.com:8081/twitter',
                dataType: 'jsonp',
                crossDomain: true,
                async: true,
            })
                .done(function(data) {
                    console.dir(data)
                })
        },
        renderTwits: function() {
            $('[data-js-items-container]', this.$el)
        }
    });


    return TwitterNewsComponent;
});
