/*
 * Copyright 2016 EPAM Systems
 * 
 * 
 * This file is part of EPAM Report Portal.
 * https://github.com/reportportal/service-ui
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
    var App = require('app');
    var Main = require('mainview');
    var LaunchPage = require('launches/LaunchPage');
    var Util = require('util');
    var Service = require('coreService');
    var Admin = require('admin');
    var Register = require('register/registerView');
    var LoginView = require('login/loginView');
    var InvalidPage = require('invalidPage/invalidPage');

    var SingletonAppModel = require('model/SingletonAppModel');
    var SingletonLaunchFilterCollection = require('filters/SingletonLaunchFilterCollection');

    var config = App.getInstance();
    var appModel = new SingletonAppModel();
    var launchFilterCollection = new SingletonLaunchFilterCollection();

    var Context = {

        currentContext: null,

        mainView: undefined,

        invalidView: null,

        contentView: null,

        currentProjectId: null,

        bodyContainer: null,

        mainContainer: null,

        containersSet: false,

        wrongResponseTo404: function (error) {
            config.userModel.clearLastInsidePage();
            this.openInvalid(error);
        },

        loadProject: function () {
            var self = this;

            return Service.getProject().then(
                function (response) {
                    self.currentProjectId = response.projectId;
                    config.project = response;
                    appModel.parse(response);
                });
        },

        loadPreferences: function () {
            return Service.getPreferences().done(function (response) {
                config.preferences = response;
                launchFilterCollection.parse(response.filters);
            });
        },

        openAdmin: function (page, id, action, queryString) {
            if (!config.userModel.get('isAdmin')) {
                config.router.navigate(config.userModel.get('defaultProject'), {trigger: true});
                return;
            }
            this.prepareInsideView();
            this.currentContext = page;
            if(id) {
                appModel.set({projectId: id});
            }
            this.checkForContextChange(page);
            var data = {page: page, id: id, action: action, contextName: this.currentContext, queryString: queryString};
            this.currentProjectId = null;
            this.validateMainViewByContextName();
            this.bodyContainer = $("#bodyContainer");
            if (!this.mainView) {
                this.mainView = new Admin.MainView({
                    el: this.bodyContainer
                });
                this.mainView.render(data);
            } else {
                this.mainView.update(data);
            }
        },

        openRouted: function (projectId, contextName, subContext, queryString) {
            config.trackingDispatcher.pageView(contextName);
            this.prepareInsideView();
            this.currentContext = contextName;
            this.checkForContextChange(contextName);
            this.validateMainViewForAdmin();
            this.container = $('#mainContainer');
            //TODO config.project deprecated
            config.project['projectId'] = projectId || config.userModel.get('defaultProject');
            var data = {container: this.container, projectId: projectId, contextName: contextName, subContext: subContext, queryString: queryString};

            var dependenciesCalls = [];
            if (this.preferencesAreNotLoaded()) {
                dependenciesCalls.push(this.loadPreferences());
            }

            if (appModel.get('projectId') !== projectId) {
                dependenciesCalls.push(this.loadProject());
            }
            this.destroyInvalidView();
            var self = this;
            var renderPage = function() {
                if (!self.mainView) {
                    self.mainView = new Main.MainView({
                        el: self.container,
                        contextName: contextName,
                        projectId: projectId
                    });
                    self.mainView.render(data);
                } else {
                    self.mainView.update(data);
                }
            };
            this.validateContentViewByContextName(contextName);
            if (dependenciesCalls.length) {
                $.when.apply($, dependenciesCalls).done(function () {
                    self.destroyMainView();
                    renderPage();
                }).fail(function (error) {
                    self.wrongResponseTo404(error);
                });
            } else {
                renderPage();
            }
        },

        preferencesAreNotLoaded: function () {
            return !config.preferences || config.preferences.projectRef !== config.project.projectId;
        },

        checkForContextChange: function (newContext) {
            if (this.currentContext && this.currentContext !== newContext) {
                Util.clearXhrPool();
            }
            this.currentContext = newContext;
        },

        openRegister: function (id) {
            this.prepareOutsideView();
            this.outsideView = new Register({
                uuid: id,
                context: this
            });
            $('[data-js-notapplication-container]').html(this.outsideView.$el);
        },
        openLogin: function () {
            this.prepareOutsideView();
            this.outsideView = new LoginView({
                context: this
            });
            $('[data-js-notapplication-container]').html(this.outsideView.$el);
        },
        prepareOutsideView: function() {
            this.destroyViews();
            this.outsideView && this.outsideView.destroy();
            $('[data-js-application-container]').addClass('hide');
        },
        prepareInsideView: function() {
            this.outsideView && this.outsideView.destroy();
            $('[data-js-application-container]').removeClass('hide');
        },

        isSettingsPage: function (context) {
            return context === 'settings';
        },

        validateMainViewForAdmin: function () {
            if (this.mainView && this.mainView.contextName === 'admin') {
                this.destroyMainView();
            }
        },

        validateMainViewByContextName: function () {
            if (this.mainView && this.mainView.contextName !== 'admin') {
                this.destroyMainView();
            }
        },

        destroyViews: function () {
            this.destroyContentView();
            this.destroyMainView();
        },

        validateContentViewByContextName: function (name) {
            // empty content view if context changed
            if (this.contentView && this.contentView.contextName !== name) {
                this.destroyContentView();
            }
        },

        openInvalid: function (error) {
            this.prepareOutsideView();
            this.outsideView = new InvalidPage({
                error: error
            });
            $('[data-js-notapplication-container]').html(this.outsideView.$el);

            // this.validateContentViewByContextName("not-found");
            // var target;
            // if (this.mainView) {
            //     target = $("#dynamic-content", this.mainView.$el);
            // } else {
            //     target = $("#mainContainer");
            // }
            // this.invalidView = new NotFoundPage({container: target}).render();
        },

        logout: function () {
            this.currentProjectId = null;
            Util.ajaxInfoMessenger('logOuted');
        },

        destroyMainView: function () {
            if (this.mainView) {
                this.mainView.destroy();
                this.mainView = null;
            }
        },

        destroyContentView: function () {
            if (this.contentView) {
                this.contentView.destroy();
                this.contentView = null;
            }
        },

        destroyInvalidView: function () {
            if (this.invalidView) {
                this.invalidView.destroy();
                this.invalidView = null;
            }
        },

        getAppProp: function () {
            var mainView = this.mainView;
            return {
                getMainView: function () {
                    return mainView;
                }
            }
        }
    };

    _.extend(Context, Backbone.Events);
    return Context;
});
