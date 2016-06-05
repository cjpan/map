'use strict';

var map;
var infoWindow;

var VenueModel = function (marker, name, contact, address) {
    this.marker = marker;
    this.name = ko.observable(name);
    this.contact = contact;
    this.address = address;
};

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
	}, 500);
};

// Information
VenueModel.prototype.info = function() {
  var contentString = '<div class="markerInfo"><p id="locationName">' +
      this.name() + '</p><p id="locationAddress">' + this.contact +
      '</p><p id="locationDescription">' + this.address;
  infoWindow.setContent(contentString);
  infoWindow.open(map, this.marker);
};

var MapViewModel = function() {
    var self = this;
    self.venues = ko.observableArray([]); // all venues
    self.keyword = ko.observable('');
    self.foursquareVenues = ko.observableArray([]); //list of venues from Foursquare API
    var foursquareBaseUrl = "https://api.foursquare.com/v2/venues/explore?oauth_token=P5LKHSBP44HASISJWX4QVDQH3NZ31OY02WEWQ2PQUYP4OXYX";

    $.getJSON(foursquareBaseUrl, {
        ll: '35.299925, 139.4786873',
        limit: 20,
        section: 'food',
        v: '20160106',
        radius: 500
    }).done(function(data) {
        self.foursquareVenues(data.response.groups[0].items);
        self.bounds = new google.maps.LatLngBounds();

        //Creating markers to pop up the map
        for (var i = 0; i < self.foursquareVenues().length; i++) {
            createVenues(self.foursquareVenues()[i]);
        }
        map.fitBounds(self.bounds);
    }).fail(function(jqXHR, status, error) {
        alert("Forsquare API is not reachable. Try to refresh this page later");
    });

  //Generates markesr data from locations list
    function createVenues(data) {
        var lat = data.venue.location.lat;
        var lng = data.venue.location.lng;
        var name = data.venue.name;
        var position = new google.maps.LatLng(lat, lng);
        var address = data.venue.location.formattedAddress || '';
        var contact = data.venue.contact.formattedPhone || '';

        self.bounds.extend(position);
        map.fitBounds(self.bounds);
        map.setCenter(self.bounds.getCenter());

        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: name,
            animation: google.maps.Animation.DROP,
        });

        var venue = new VenueModel(marker, name, contact, address);

        self.venues.push(venue);
        marker.addListener('click', function(){
            map.panTo(position);
            venue.info();
            venue.bounce();
        });
    };

    self.displayVenues = ko.computed(function() {
        return self.venues().filter(function(venue) {
            if (venue.name().toLowerCase().indexOf(self.keyword().toLowerCase()) > -1) {
                venue.marker.setMap(map);
                return true;
            } else {
                venue.marker.setMap(null);
                return false;
            }
        });
    }); //list of venues to display
}

var myModel = {
    viewModel: new MapViewModel()
}

function initMap() {
    var mapOptions = {
        //  zoom: 17,
        //  disableDefaultUI: false,
        center: {lat: 35.299925, lng: 139.4786873}
    };
    map = new google.maps.Map(document.querySelector('#map'), mapOptions);
    infoWindow = new google.maps.InfoWindow();
}

var googleSuccess = function() {
    initMap();
    ko.applyBindings(myModel.viewModel);
}

function googleMapsError() {
	document.getElementsByClassName('map')[0].innerHTML = '<div class="google-error">Sorry, Google Map could not be loaded</div>';
}
