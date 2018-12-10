var afServerName = "MABOTEROW7";
var afDatabaseName = "GoogleStreetView";
var afTemplateName = "StreetView_EFTemplate";

var piwebapi = (function () {

    var basePIWebAPIUrl = null;
    var currentUserName = null;
    var currentPassword = null;
    var currentEFName = null;

    var processJsonContent = function (url, type, data, successCallBack, errorCallBack) {
        return $.ajax({
            url: url,
            type: type,
            data: data,
            contentType: "application/json; charset=UTF-8",            
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization",makeBasicAuth(currentUserName,currentPassword))
            },
            success: successCallBack,
            error: errorCallBack
        });
    };

    var makeBasicAuth = function (user, password) {
        var tok = user + ":" + password;
        var hash = window.btoa(tok)
        return "Basic " + hash;
    };

    var getDatabaseWebId = function (databaseName , successCallBack, errorCallBack ) {
        var url = basePIWebAPIUrl + "assetdatabases?path=\\\\" + afServerName + "\\" + databaseName;
        return processJsonContent(url, "GET", successCallBack, errorCallBack);        
    };

    var getEventFrameWebId = function (databaseName, eventFrameName, successCallBack, errorCallBack) {
        var url = basePIWebAPIUrl + "eventframes?path=\\\\" + afServerName + "\\" + databaseName
            + "\\EventFrames[" + eventFrameName + "]";
        return processJsonContent(url, "GET", null, successCallBack, errorCallBack);
    }

    return {
        SetBaseUrl: function (baseUrl) {
            basePIWebAPIUrl = baseUrl;
            if (basePIWebAPIUrl.slice(-1) != "/") {
                basePIWebAPIUrl = basePIWebAPIUrl + "/";
            }
        },
        SetCredentials: function (user, password) {
            currentUserName = user;
            currentPassword = password;
        },
        Authorize: function (successCallBack, errorCallBack) {
            return processJsonContent(basePIWebAPIUrl, "GET", null, successCallBack, errorCallBack);
        },
        Reset: function () {
            basePIWebAPIUrl = null;
            currentUserName = null;
            currentPassword = null;
            currentEFName = null;
        },
        CreateEventFrame: function () {
            var ajaxDb = getDatabaseWebId(afDatabaseName, null, null);

            $.when(ajaxDb).fail(function () {
                console.log("Cannot connect to AF Database: " + afDatabaseName);
            });

            $.when(ajaxDb).done(function (data) {
                var url = basePIWebAPIUrl + "assetdatabases/" + data.WebId + "/eventframes";
                var now = JSON.stringify(new Date());
                currentEFName = currentUserName + now.slice(1, now.length - 1);
                var data = {
                    "Name" : currentEFName,
                    "Description": "Event frame for user: "+ currentUserName,
                    "TemplateName": afTemplateName   ,
                    "StartTime": "*",
                    "EndTime": "+5m"
                };
                var postData = JSON.stringify(data);
                var ajaxEF = processJsonContent(url, "POST", postData, null, null);

                $.when(ajaxEF).fail(function () {
                    console.log("Cannot create event frame");
                });

                $.when(ajaxEF).done(function () {
                    console.log("Event frame create successfully");
                    alert("You may now estart recording");
                });
            });
        },

        CloseEventFrame: function(){
            var ajaxEF = getEventFrameWebId(afDatabaseName, currentEFName, null, null);

            $.when(ajaxEF).fail(function () {
                console.log("Cannot find event frame: "+ currentEFName);
            });

            $.when(ajaxEF).done(function (data) {
                var url = basePIWebAPIUrl + "eventframes/" + data.WebId;
                var data = {
                    "EndTime": "*"
                }
                var patchData = JSON.stringify(data);
                var ajaxEF2 = processJsonContent(url, "PATCH", patchData, null, null);

                $.when(ajaxEF2).fail(function () {
                    console.log("Cannot close event frame: "+ currentEFName);
                });

                $.when(ajaxEF2).done(function () {
                    console.log("Event frame closed successfully.");
                    alert("The recording has ended.");
                });
               
            });

        }

    };
})();