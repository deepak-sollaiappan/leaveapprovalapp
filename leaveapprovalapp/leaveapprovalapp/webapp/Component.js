sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "namespace/leaveapprovalapp/model/models"
], function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend("namespace.leaveapprovalapp.Component", {

        metadata: {
            manifest: "json"
        },

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            this.setTaskModels();


            this.getInboxAPI().addAction({
                action: "APPROVE",
                label: "Approve",
                type: "accept" // (Optional property) Define for positive appearance
            }, function () {
                this.completeTask(true);
            }, this);

            this.getInboxAPI().addAction({
                action: "REJECT",
                label: "Reject",
                type: "reject" // (Optional property) Define for negative appearance
            }, function () {
                this.completeTask(false);
            }, this);


        },

        setTaskModels: function () {
            // set the task model
            var startupParameters = this.getComponentData().startupParameters;
            // var a = JSON.stringify(startupParameters);
            // console.log(a + "startup parameters");
                var taskModel = startupParameters.taskModel;
            var taskData = taskModel.getData();
            var taskId = taskData.InstanceID;
            
            //  console.log(taskId + "taskID");


            this.setModel(startupParameters.taskModel, "task");

            // set the task context model
            var taskContextModel = new sap.ui.model.json.JSONModel(this._getTaskInstancesBaseURL() + "/context");
            this.setModel(taskContextModel, "context");
        },

        _getTaskInstancesBaseURL: function () {
            return this._getWorkflowRuntimeBaseURL() + "/task-instances/" + this.getTaskInstanceID();
        },


        _getWorkflowRuntimeBaseURL: function () {
            var appId = this.getManifestEntry("/sap.app/id");
            // console.log(appId + "appId")

            var appPath = appId.replaceAll(".", "/");

            // console.log(appPath + "apppath")
            // @ts-ignore
            var appModulePath = jQuery.sap.getModulePath(appPath);
            // console.log(appModulePath + "appmodulepath")



            return appModulePath + "/bpmworkflowruntime/v1";
        },

        getInboxAPI: function () {
            var startupParameters = this.getComponentData().startupParameters;
            return startupParameters.inboxAPI;
        },

        getTaskInstanceID: function () {
            return this.getModel("task").getData().InstanceID;
        },


        completeTask: function (approvalStatus) {
            this.getModel("context").setProperty("/approved", approvalStatus);
            this._patchTaskInstance();
            this._refreshTaskList();
        },

        _patchTaskInstance: function () {
            var data = {
                status: "COMPLETED",
                context: this.getModel("context").getData()
            }

            // @ts-ignore
            jQuery.ajax({
                url: this._getTaskInstancesBaseURL(),
                method: "PATCH",
                contentType: "application/json",
                async: false,
                data: JSON.stringify(data),
                headers: {
                    "X-CSRF-Token": this._fetchToken()
                }
            });
        },

        _fetchToken: function () {
            var fetchedToken;

            // @ts-ignore
            jQuery.ajax({
                url: this._getWorkflowRuntimeBaseURL() + "/xsrf-token",
                method: "GET",
                async: false,
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success(result, xhr, data) {
                    fetchedToken = data.getResponseHeader("X-CSRF-Token");
                }
            });
            return fetchedToken;
        },

        _refreshTaskList: function () {
            this.getInboxAPI().updateTask("NA", this.getTaskInstanceID());
        }


    });
});
