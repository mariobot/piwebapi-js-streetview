var afServerName = "MABOTEROW7";
var afDatabaseName = "GoogleStreetView";
var afTemplateName = "StreetView_EFTemplate";

var piwebapi = (function () {

    var basePIWebAPIUrl = null;
    var currentUserName = null;
    var currentPassword = null;
    var currentEFName = null;
    var currentEFWebId = null;
    var currentAttributesWebId = null;
    var attributesWebId = null;

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
    };

    var getAttributesWebId = function (eventframeWebId, successCallBack, errorCallBack) {
        var url = basePIWebAPIUrl + "eventframes/" + eventframeWebId + "/attributes";
        return processJsonContent(url, "GET", null, successCallBack, errorCallBack);
    };

    var SendValuesToPI = function (panorama) {
        var data = [];
        
        //console.log("attributesWebID");
        //console.log(attributesWebId);

        for (var key in attributesWebId) {
            var obj = {};
            obj.WebId = attributesWebId[key];
            obj.Items = [];           

            var newValue = {};
            newValue.Timestamp = "*";
            if (key == "Latitude") {
                //console.log("Lat: " + panorama.position.lat());
                newValue.Value = panorama.position.lat();
            }
            else if (key == "Longitude") {
                //console.log(panorama.position.lng());
                newValue.Value = panorama.position.lng();
            }
            else if (key == "Heading") {
                //console.log(panorama.pov.heading);
                newValue.Value = panorama.pov.heading;
            }
            else if (key == "Pitch") {
                //console.log(panorama.pov.pitch);
                newValue.Value = panorama.pov.pitch;
            }
            else if (key == "Zoom") {
                //console.log(panorama.pov.zoom);
                newValue.Value = panorama.pov.zoom;
            }

            //console.log(newValue);

            obj.Items.push(newValue);
            data.push(obj);
        }

        var postData = JSON.stringify(data);
        var url = basePIWebAPIUrl + "streamsets/" + currentEFWebId + "/recorded";        
        var ajax = processJsonContent(url, "POST", postData, null, null);

        //console.log("Post Data: ")
        //console.log(postData);

        $.when(ajax).fail(function () {
            console.log("Cannot Write data to AF Attributes");
        });

        $.when(ajax).done(function () {
            console.log("Updated AF Attributes");
        });
    };

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
            currentEFWebId = null;
            currentAttributesWebId = null;
            attributesWebId = null;
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

        CloseEventFrame: function () {            
            var ajaxEF = getEventFrameWebId(afDatabaseName, currentEFName, null, null);

            $.when(ajaxEF).fail(function () {
                console.log("Cannot find event frame: " + currentEFName);
            });

            $.when(ajaxEF).done(function (data) {                    
                var url = basePIWebAPIUrl + "eventframes/" + data.WebId;
                var data = {
                    "EndTime": "*"
                }
                var patchData = JSON.stringify(data);
                var ajaxAttr = processJsonContent(url, "PATCH", patchData, null, null);

                $.when(ajaxAttr).fail(function () {
                    console.log("Cannot close event frame: " + currentEFName);
                });

                $.when(ajaxAttr).done(function () {
                    console.log("Event frame closed successfully.");
                    alert("The recording has ended.");
                });
            });            
        },

        SendValues: function (panorama) {
            if (currentEFWebId == null || currentAttributesWebId == null) {
                var ajaxEF = getEventFrameWebId(afDatabaseName, currentEFName, null, null);

                $.when(ajaxEF).fail(function () {
                    console.log("Cannot find event frame: " + currentEFName);
                });

                $.when(ajaxEF).done(function (data) {
                    currentEFWebId = data.WebId;                    
                    var ajaxAttr = getAttributesWebId(currentEFWebId, null, null);

                    $.when(ajaxAttr).fail(function () {
                        console.log("Cannot find attributes from event frame");
                    });                    
                    $.when(ajaxAttr).done(function (data) {
                        // Get attributes WebId
                        attributesWebId = {};
                        for (var i = 0; i < data.Items.length; i++) {                            
                            attributesWebId[data.Items[i].Name] = data.Items[i].WebId;
                        }                        
                        // Send values to attributes                                                
                        SendValuesToPI(panorama);
                    });
                });
            }
            else {
                SendValuesToPI(panorama);
            }
        }
    };
})();