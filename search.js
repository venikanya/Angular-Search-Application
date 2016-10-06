var app = angular.module('search', ['ngRoute','ngAnimate']);
var latLangObj,
	map,
	infoWindow;
app.controller('SearchController', function($scope,$http,$location, $anchorScroll) {
	$scope.places=[];
	$scope.scroll=false;
	$scope.getResults = function(){
		$scope.places=[];
		$scope.error_msg="";
		$http({
	        method : "GET",
	        url : "https://maps.googleapis.com/maps/api/geocode/json?address="+$scope.searchString+"&key=AIzaSyCBLbx-IY0PmIrml-DhttkU053qlrvDBFk"
	    }).then(function mySucces(response) {
	    	if(response.data.status == google.maps.places.PlacesServiceStatus.OK){
		    	latLangObj = new google.maps.LatLng(response.data.results[0].geometry.location);
		    	var request = {
					location: latLangObj,
					radius:'500'
				};
				map = new google.maps.Map(document.getElementById('map'), {
		          center: latLangObj,
		          zoom: 15
		        });
				app.service = new google.maps.places.PlacesService(map);
				app.service.nearbySearch(request,function(results, status){
					if(results.length > 0){
				        infowindow = new google.maps.InfoWindow();					
						$scope.$apply(function(){
							$scope.places=callbk(results,status);
						});					
					}
					else{
						$scope.$apply(function(){
							$scope.error_msg="No results found. Please try a different one."
						});
					}
				});
			}
			else{
				$scope.error_msg = response.data.error_message;
			}
		}, function myError(response) {
			$scope.error_msg = response.data.error_message;
	    });	
	}
	$scope.changeIcon = function(idx, $event){
		$scope["isExpand"+idx] = $scope["isExpand"+idx]?false:true;
		//get the position attributes for div
		var tdEl = angular.element($event.currentTarget.parentElement);
		if(tdEl.hasClass("hideExpandCollapse"))
			return;
		var $rowEl = angular.element($event.currentTarget.parentElement.parentElement);
		var $conDiv = angular.element(document.getElementById('contentDiv'+idx));
		var $detailsRowEl = angular.element(document.getElementById('contentRow'+idx));
 		if($conDiv.hasClass("ng-show")){
 			$rowEl.css({"height" : "auto"});
      		$conDiv.css({"display" : "none", "left": "auto", "top" : "auto"});
      		$conDiv.addClass("ng-hide");
			$conDiv.removeClass("ng-show");
			if($detailsRowEl)
				$detailsRowEl.find("td").css({"display":"none"});
 		}
 		else{
			if($detailsRowEl.length == 0){
				$detailsRowEl = angular.element("<tr id='contentRow"+idx+"'><td style='height:150px;' colspan='4'></td></tr>");
				$detailsRowEl.find("td").append($conDiv);
				$rowEl.after($detailsRowEl);
			}
			else{
				$detailsRowEl.find("td").css({"display":"table-cell"});
			}			
			$conDiv.css({"display":"block"});			
			if(!$scope.places[idx-1].place_details)
				getDetailedPlaceInfo($scope.places[idx-1].place_id, idx-1);
			$conDiv.addClass("ng-show");
			$conDiv.removeClass("ng-hide");
		}
		if($scope.scroll){
			$location.hash('contentRow'+idx);
		    $anchorScroll();
		    $scope.scroll = false;
		}
	}
	function callbk(results, status){
		if (status === google.maps.places.PlacesServiceStatus.OK) {
			var recsToDisplay=[]
          for (var i = 0; i < results.length; i++) {
            createMarker(results[i],i);
            recsToDisplay.push(populateList(results[i]));
            $scope["isExpand"+(i+1)] = true;
          }
          return recsToDisplay;
        }
	}
	function createMarker(place,idx) {
        var placeLoc = place.geometry.location;
        var marker = new google.maps.Marker({
          position: placeLoc,
          visible:true
        });
        var me= this;
        marker.setMap(map);
        google.maps.event.addListener(marker, 'mouseover', function() {
          infowindow.setContent(place.name);
          infowindow.open(map, this);
        });
        google.maps.event.addListener(marker, 'mouseout', function() {
          infowindow.close();
        });
        google.maps.event.addListener(marker, 'click', function() {
          expandDiv(idx);
        });
    }
	function populateList(place){
		var result={};
		result["image"] = place.icon;
		result["name"] = place.name;
		result["place_id"] = place.place_id;
		if(place.opening_hours){
			if(place.opening_hours.open_now){
				result["isOpen"] = "Open Now";
				result["labelClass"] = "label-success";
			}
			else{
				result["isOpen"] = "Closed Now";
				result["labelClass"] = "label-danger";
			}
		}
		if(place.geometry.viewport)
			result["expandCollapse"]="hideExpandCollapse";
		else
			result["expandCollapse"]="showExpandCollapse";
		return result;
	}
	function getDetailedPlaceInfo(place_id, indexOfObj){
		app.service.getDetails({
			placeId:place_id
		},function(place,status){
			if (status === google.maps.places.PlacesServiceStatus.OK) {
				$scope.$apply(function(){
					$scope.places[indexOfObj].place_details=constructPlaceDetailObj(place);
				});            
        	}
		})
	}
	function constructPlaceDetailObj(place){
		var result={};
		if(place.photos && place.photos.length > 0)
			result["image_url"] = place.photos[0].getUrl({'maxWidth': 120, 'maxHeight': 120});
		result["address"]= place.formatted_address;
		result["phone"] = place.formatted_phone_number;
		result["website"] = place.website;
		result["ratings"] = place.rating;
		var starCount = Math.round(place.rating);
		if(starCount >=5)
			result["star5"] = "star5";
		if(starCount>=4)
			result["star4"] = "star4";
		if(starCount>=3)
			result["star3"] = "star3";
		if(starCount>=2)
			result["star2"] = "star2";
		if(starCount>=1)
			result["star1"] = "star1";
		return result;
	}
	function expandDiv(idx){
		$scope.scroll = true;
		var btn = angular.element(document.getElementById('expand'+idx));
		btn[0].click();
	}
});