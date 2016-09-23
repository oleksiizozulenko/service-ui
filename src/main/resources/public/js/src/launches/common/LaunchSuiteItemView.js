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
    var Backbone = require('backbone');
    var Epoxy = require('backbone-epoxy');
    var Util = require('util');
    var App = require('app');
    var SingletonDefectTypeCollection = require('defectType/SingletonDefectTypeCollection');
    var LaunchSuiteStepItemMenuView = require('launches/common/LaunchSuiteStepItemMenuView');
    var LaunchStatisticsDefectsView = require('launches/launchSuiteStatistics/LaunchStatisticsDefectsView');
    var LaunchStatisticsExecutionsView = require('launches/launchSuiteStatistics/LaunchStatisticsExecutionsView');
    var ItemDurationView = require('launches/common/ItemDurationView');
    var SingletonUserStorage = require('storage/SingletonUserStorage');
    var d3 = require('d3');
    var nvd3 = require('nvd3');

    var config = App.getInstance();

    var LaunchSuiteItemView = Epoxy.View.extend({
        template: 'tpl-launch-suite-item',
        statusTpl: 'tpl-launch-suite-item-status',
        events: {
            'click [data-js-name]': 'onClickName',
            'click [data-js-launch-menu]:not(.rendered)': 'showItemMenu',
            'click [data-js-time-format]': 'toggleStartTimeView'
        },
        bindings: {
            '[data-js-analize-label]': 'classes: {hide: not(isProcessing)}',
            '[data-js-name]': 'text: name, attr: {href: url}',
            '[data-js-launch-number]': 'text: numberText',
            '[data-js-description]': 'text: description',
            '[data-js-owner-block]': 'classes: {hide: not(owner)}',
            '[data-js-owner-name]': 'text: owner',
            '[data-js-time-from-now]': 'text: startFromNow',
            '[data-js-time-exact]': 'text: startFormat'
        },
        computeds: {},
        initialize: function(options) {
            this.statistics = [];
            this.userStorage = new SingletonUserStorage();
            this.render();
        },
        render: function() {
            var data = this.model.toJSON();
            data.sortTags = this.model.get('sortTags'); // computed field
            this.$el.html(Util.templates(this.template, data));
            this.renderDuration();

            this.renderStatistics();
        },
        toggleStartTimeView: function (e) {
            var $el = $(e.currentTarget),
                table = $el.closest('[data-js-table-container]'),
                timeFormat = this.userStorage.get('startTimeFormat');
            if(timeFormat === 'exact'){
                table.removeClass('exact-driven');
                timeFormat = ''
            }
            else {
                table.addClass('exact-driven');
                timeFormat = 'exact';
            }
            this.userStorage.set('startTimeFormat', timeFormat);
        },
        getDurationTime: function() {
            var startTime = this.getBinding('start_time'),
                endTime = this.getBinding('end_time');
            return Util.timeFormat(startTime, endTime);
        },
        renderStatistics: function(){
            var statistics = this.model.get('statistics');
            _.each(statistics, function(v, k){
                _.each(v, function(val, key){
                    var statsView = this.getStatisticsView(k),
                        view = new statsView({
                            type: key,
                            model: this.model,
                            $container: $('[data-js-statistics-'+key+']', this.$el)
                        });
                    this.statistics.push(view)
                }, this);
            }, this);
        },
        renderDuration: function(){
            this.duration = new ItemDurationView({
                model: this.model,
                $el: $('[data-js-item-status]', this.$el)
            });
        },
        getStatisticsView: function(type){
            switch (type) {
                case 'defects':
                    return LaunchStatisticsDefectsView;
                    break;
                case 'executions':
                    return LaunchStatisticsExecutionsView;
                    break;
                default:
                    break;
            }
        },
        showItemMenu: function (e) {
            var $link = $(e.currentTarget);
            this.menu = new LaunchSuiteStepItemMenuView({
                model: this.model
            });
            $link
                .after(this.menu.$el)
                .addClass('rendered')
                .dropdown();
        },
        onClickName: function(e) {
            e.preventDefault();
            this.model.trigger('drill:item', this.model);
            config.router.navigate($(e.currentTarget).attr('href'), {trigger: true});
        },
        destroy: function () {
            this.menu && this.menu.destroy();
            this.duration && this.duration.destroy();
            _.each(this.statistics, function(v){
                if(_.isFunction(v.destroy)){
                    v.destroy();
                }
            });
            this.undelegateEvents();
            this.stopListening();
            this.unbind();
            this.$el.html('');
            delete this;
        }
    });

    return LaunchSuiteItemView;
});
