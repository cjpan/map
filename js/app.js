'use strict';

var map;
var infoWindow;
var FOURSQUARE_REQUEST_SETTING = {
      ll: '35.299925, 139.4786873',
      limit: 20,
      section: 'food',
      v: '20160106',
      radius: 500
};
var FOURSQUARE_BASE_URL = "https://api.foursquare.com/v2/venues/explore?oauth_token=P5LKHSBP44HASISJWX4QVDQH3NZ31OY02WEWQ2PQUYP4OXYX";

var VenueModel = function (data) {
    var lat = data.venue.location.lat;
    var lng = data.venue.location.lng;
    this.position = new google.maps.LatLng(lat, lng);

    this.name = ko.observable(data.venue.name);
    this.address = data.venue.location.formattedAddress || '';
    this.contact = data.venue.contact.formattedPhone || '';

    this.marker = new google.maps.Marker({
        map: map,
        position: this.position,
        title: name,
        animation: google.maps.Animation.DROP,
    });
}

// Bounce marker
VenueModel.prototype.bounce = function() {
    var obj;
  	if (this.hasOwnProperty('marker')) {
    	obj = this.marker;
  	} else {
    	obj = this;
  	}
  	obj.setAnimation(google.maps.Animation.BOUNCE);
  	setTimeout(function() {
	    obj.setAnimation(null);
  	}, 1000);
}

// Information
VenueModel.prototype.info = function() {
    var contentString = '<div class="markerInfo"><p id="locationName">' +
        this.name() + '</p><p id="locationAddress">' + this.contact +
        '</p><p id="locationDescription">' + this.address;
    infoWindow.setContent(contentString);
    infoWindow.open(map, this.marker);
}

// Animation
VenueModel.prototype.animate = function() {
	this.bounce();
	this.info();
}

var MapViewModel = function() {
    var self = this;
    self.venues = ko.observableArray([]); // all venues
    self.keyword = ko.observable('');
    self.foursquareVenues = ko.observableArray([]); //list of venues from Foursquare API

    $.getJSON(FOURSQUARE_BASE_URL, FOURSQUARE_REQUEST_SETTING).done(function(data) {
        self.foursquareVenues(data.response.groups[0].items);
        self.bounds = new google.maps.LatLngBounds();
        //Creating markers to pop up the map
        for (var i = 0; i < self.foursquareVenues().length; i++) {
            var venue = new VenueModel(self.foursquareVenues()[i]);
            self.venues.push(venue);
            self.bounds.extend(venue.position);
            map.fitBounds(self.bounds);
            map.setCenter(self.bounds.getCenter());
        }
    }).fail(function(jqXHR, status, error) {
        alert("Forsquare API is not reachable. Try to refresh this page later");
    });

    self.displayVenues = ko.computed(function() {
        return self.venues().filter(function(venue) {
            if (venue.name().toLowerCase().indexOf(self.keyword().toLowerCase()) > -1) {
                venue.marker.setMap(map);
                venue.marker.addListener('click', function(){
				    map.panTo(venue.position);
				    venue.animate();
				});
                return true;
            } else {
                venue.marker.setMap(null);
                return false;
            }
        });
    }); //list of venues to display
}

function initMap() {
    map = new google.maps.Map(document.querySelector('#map'));
    infoWindow = new google.maps.InfoWindow();
}

var googleSuccess = function() {
    initMap();
    ko.applyBindings(new MapViewModel());
}

function googleMapsError() {
	document.getElementsByClassName('map')[0].innerHTML = '<div class="google-error">Sorry, Google Map could not be loaded</div>';
}
