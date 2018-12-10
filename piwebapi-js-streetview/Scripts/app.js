var map;
var marker;
var panorama;
var geocoder;

var updatePanoramaDOM = function () {
    $("#latitude").text(panorama.position.lat);    
    $("#longitude").text(panorama.position.lng);
    $("#heading").text(panorama.pov.heading);
    $("#pitch").text(panorama.pov.pitch);
    $("#zoom").text(panorama.pov.zoom);

    marker.setPosition(panorama.position);
};

$("#go-to-map-btn").click(function () {
    $("#auth-view-mode").hide();
    $("#map-view-mode").show();

    var indralocation = { lat: 4.805626, lng: -75.690198 };

    map = new google.maps.Map(document.getElementById("map"), {
        center: indralocation,
        zoom: 16,
        streetVireControl: false
    });

    marker = new google.maps.Marker({
        position: indralocation,
        map: map
    });

    panorama = new google.maps.StreetViewPanorama(document.getElementById("pano"),{
        position: indralocation,
        pov: {
            heading: 0,
            pitch: 0,
            zoom: 1
        }
    });

    geocoder = new google.maps.Geocoder();

    panorama.addListener("pano_changed", function () {
        updatePanoramaDOM();
    });
    panorama.addListener("links_changed", function () {
        updatePanoramaDOM();
    });
    panorama.addListener("position_changed", function () {
        updatePanoramaDOM();
    });
    panorama.addListener("pov_changed", function () {
        updatePanoramaDOM();
    });
});
$("#search-address-btn").click(function () {
    var address = document.getElementById("address").value;

    geocoder.geocode({ "address": address }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            marker.setPosition(results[0].geometry.location);            
            panorama.setPosition(results[0].geometry.location);
            panorama.setPov({
                heading: 0,
                pitch: 0,
                zoom: 1
            });
        } else {
            alert("Geocodo was no succefull for the next reason " + status);
        }
    });
});

$("#back-btn").click(function () {
    $("#auth-view-mode").show();
    $("#map-view-mode").hide();
});

