import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Button,
  Alert,
  View,
  Linking,
} from "react-native";
import WebView from "react-native-webview";
import * as Location from "expo-location";
import { Slider, FAB } from "@rneui/themed";
import { useInterval } from "../../common/useIntervall";
import axiosInstance from "../../axios-instance";
import html_script from "./html_script";
import Compass from "../compass";

const OWN_MARKER = "ownMarker";
const FRIEND_MARKER = "friendMarker";

const toleratedDeviation = 0.02; //0.01 Kilometer = 10 Meter

const MapWebview = ({
  trackedFriend,
  setTrackedFriend,
  token,
  setAcceptedTracking,
  getContactNameByNumber,
}) => {
  const mapRef = useRef(null);

  const [ownLocation, setOwnLocation] = useState({
    lat: 37.78825,
    lng: -122.4324,
  });
  const [oldOwnLocation, setOldOwnLocation] = useState({
    lat: 37.78825,
    lng: -122.4324,
  });

  const [friendLocation, setFriendLocation] = useState({
    lat: 0,
    lng: 0,
  });
  const [oldFriendLocation, setOldFriendLocation] = useState({
    lat: 0,
    lng: 0,
  });

  const [distance, setDistance] = useState("376 m");

  const [latSliderValue, setLatSliderValue] = useState(0);
  const [lngSliderValue, setLngSliderValue] = useState(0);

  const [isRouting, setIsRouting] = useState(false);
  const [friendMarkerAdded, setFriendMarkerAdded] = useState(false);
  const [routeButtonColor, setRouteButtonColor] = useState("green");

  const [isShowingDirections, setIsShowingDirections] = useState(false);
  const [directionsButtonColor, setDirectionsButtonColor] = useState("green");

  const [firstRender, setFirstRender] = useState(true);
  const [locationUpdates, setLocationUpdates] = useState(0);

  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const verifyPermissions = async () => {
    const result = await Location.requestForegroundPermissionsAsync();
    if (result.status !== "granted") {
      Alert.alert(
        "No Permissions!",
        "Please give location permissions to use this app.",
        [{ title: "Ok" }]
      );
      setHasLocationPermission(false);
      return false;
    } else {
      setHasLocationPermission(true);
      return true;
    }
  };

  const getLocationHandler = async () => {
    const hasPermission = await verifyPermissions();
    if (!hasPermission) {
      return;
    }
    try {
      const location = await Location.getCurrentPositionAsync({
        timeout: 5000,
      });
      setOwnLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    } catch (err) {
      Alert.alert(
        "Could not get location!",
        "Please try again later and make sure your location is enabled",
        [{ title: "Ok" }]
      );
    }
  };

  const centerOnPosition = (lat, lon, zoom) => {
    mapRef.current.injectJavaScript(`
        setTimeout(() => {
            map.setView([${lat}, ${lon}], ${zoom});
        }, 100);
        `);
  };

  const setMarker = (marker, lat, lon) => {
    mapRef.current.injectJavaScript(`setTimeout(() => {
            ${marker}.setLatLng([${lat}, ${lon}]);
        }, 100);
        `);
  };

  const addMarker = (name, lat, lon, popupText) => {
    //name = ownMarker / friendMarker
    if (popupText == undefined) {
      mapRef.current.injectJavaScript(`setTimeout(() => {
                ${name} = L.marker([${lat}, ${lon}]).addTo(map);
            }, 100);
            `);
    } else {
      mapRef.current.injectJavaScript(`setTimeout(() => {
                ${name} = L.marker([${lat}, ${lon}]).addTo(map).bindPopup('<p align="center"> ${popupText} </p>');
            }, 100);
            `);
    }
  };

  const changeMarkerColor = (name, color) => {
    //Color = Red / Green / Blue / Purple / Yellow
    mapRef.current.injectJavaScript(`setTimeout(() => {
            ${name}._icon.classList.add("hueChange${color}");
        }, 100);
        `);
  };

  const removeMarker = (name) => {
    mapRef.current.injectJavaScript(`setTimeout(() => {
            ${name}.remove();
        }, 100);
        `);
    setFriendMarkerAdded(false);
  };

  const addRoute = (startLat, startLon, endLat, endLon) => {
    mapRef.current.injectJavaScript(`setTimeout(() => {
        if (routingControl != null) {
            map.removeControl(routingControl);
            routingControl = null;
        }
        routingControl = L.Routing.control({
            waypoints: [
              L.latLng(${startLat}, ${startLon}),
              L.latLng(${endLat}, ${endLon})
            ],
            createMarker: function() { return null; },
            pointMarkerStyle: {radius: 5,color: '#03f',fillColor: 'green',opacity: 0,fillOpacity: 0}
          }).addTo(map);
          routingControl.hide();
        }, 100);
        `);
    setIsRouting(true);
  };

  const removeRoute = () => {
    mapRef.current.injectJavaScript(`setTimeout(() => {
        map.removeControl(routingControl);
        routingControl = null;
    }, 100);
        `);
    setIsRouting(false);
    setRouteButtonColor("green");
    setDirectionsButtonColor("green");
    setIsShowingDirections(false);
  };

  const hideDirections = () => {
    mapRef.current.injectJavaScript(`setTimeout(() => {
        routingControl.hide();
    }, 100);
        `);
  };

  const showDirections = () => {
    mapRef.current.injectJavaScript(`setTimeout(() => {
        routingControl.show();
    }, 100);
        `);
  };

  const updateRoutingWaypoints = () => {
    mapRef.current.injectJavaScript(`setTimeout(() => {
            routingControl.setWaypoints([
                L.latLng(${ownLocation.lat}, ${ownLocation.lng}),
                L.latLng(${friendLocation.lat}, ${friendLocation.lng})
            ]);
        }, 100);
        `);
  };

  const degreesToRadians = (degrees) => {
    return (degrees * Math.PI) / 180;
  };

  const distanceInKm = (lat1, lon1, lat2, lon2) => {
    const earthRadiusKm = 6371;

    var dLat = degreesToRadians(lat2 - lat1);
    var dLon = degreesToRadians(lon2 - lon1);

    lat1 = degreesToRadians(lat1);
    lat2 = degreesToRadians(lat2);

    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  };

  const caculauteDist = (lat1, lon1, lat2, lon2) => {
    const distance = distanceInKm(lat1, lon1, lat2, lon2);
    if (distance < 1) {
      return Math.round(distance * 1000) + " m";
    } else {
      return Math.round(distance) + " km";
    }
  };

  useEffect(() => {
    getLocationHandler();
    setFirstRender(false);
  }, []);

  useEffect(() => {
    if (locationUpdates < 2) {
      if (locationUpdates === 1) {
        centerOnPosition(ownLocation.lat, ownLocation.lng, 16);
      }
      setLocationUpdates(locationUpdates + 1);
    }

    setMarker(OWN_MARKER, ownLocation.lat, ownLocation.lng);

    //verhindert die bei größeren Strecken zeitintensive neue Berechnung der Runde bei Abweichungen unter der Toleranz
    if (
      distanceInKm(
        ownLocation.lat,
        ownLocation.lng,
        oldOwnLocation.lat,
        oldOwnLocation.lng
      ) > toleratedDeviation
    ) {
      updateRoutingWaypoints();
    }
    setOldOwnLocation(ownLocation);
    if (friendMarkerAdded) {
      setDistance(
        caculauteDist(
          ownLocation.lat,
          ownLocation.lng,
          friendLocation.lat,
          friendLocation.lng
        )
      );
    }
  }, [ownLocation]);

  useEffect(() => {
    if (!firstRender) {
      if (!friendMarkerAdded) {
        addMarker(
          FRIEND_MARKER,
          friendLocation.lat,
          friendLocation.lng,
          getContactNameByNumber(trackedFriend.number)
        );
        changeMarkerColor(FRIEND_MARKER, "Red");
        updateRoutingWaypoints();
        setFriendMarkerAdded(true);
      } else {
        setMarker(FRIEND_MARKER, friendLocation.lat, friendLocation.lng);
        //verhindert die bei größeren Strecken zeitintensive neue Berechnung der Runde bei Abweichungen unter der Toleranz
        if (
          distanceInKm(
            friendLocation.lat,
            friendLocation.lng,
            oldFriendLocation.lat,
            oldFriendLocation.lng
          ) > toleratedDeviation
        ) {
          updateRoutingWaypoints();
        }
        setOldFriendLocation(friendLocation);
      }
      setDistance(
        caculauteDist(
          ownLocation.lat,
          ownLocation.lng,
          friendLocation.lat,
          friendLocation.lng
        )
      );
    }
  }, [friendLocation]);

  useInterval(async () => {
    try {
      if (trackedFriend?.status === "accepted") {
        console.log("Getting friend location...");
        const response = await axiosInstance.post(
          "/permission/get-location-from-friend",
          { friendsTelefon: trackedFriend.number },
          { headers: { Authorization: "Bearer " + token } }
        );
        console.log(response.data);

        if (response.data.hasOwnProperty("location")) {
          setFriendLocation({
            lat: response.data.location.latitude,
            lng: response.data.location.longitude,
          });
          console.log("Set friend location");
        }
      } else if (trackedFriend?.status === "pending") {
        console.log("Status pending");
      } else if (!trackedFriend) {
        console.log("Friend is null or undefined");
        removeMarker(FRIEND_MARKER);
        removeRoute();
        setFriendMarkerAdded(false);
      }
    } catch (error) {
      console.log(error);
      setTrackedFriend(null);
      setAcceptedTracking(false);
    }
  }, 7000);

  useInterval(async () => {
    var ownLat;
    var ownLng;
    if (hasLocationPermission) {
      try {
        const location = await Location.getCurrentPositionAsync({
          timeout: 5000,
        });
        ownLat = location.coords.latitude;
        ownLng = location.coords.longitude;
        setOwnLocation({ lat: ownLat, lng: ownLng });

        if (token) {
          await axiosInstance.post(
            "/users/update-user-location",
            { latitude: ownLat, longitude: ownLng },
            { headers: { Authorization: "Bearer " + token } }
          );
        }
      } catch (err) {
        Alert.alert(
          "Could not get location!",
          "Please try again later and make sure your location is enabled",
          [{ title: "Ok" }]
        );
      }
    }
  }, 10000);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={styles.compassWrapper} pointerEvents="box-none">
        {friendMarkerAdded && (
          <Compass
            style={styles.compass}
            angle={90}
            ownLocation={ownLocation}
            friendLocation={friendLocation}
            distance={distance}
          />
        )}
      </View>
      <SafeAreaView style={styles.Container}>
        <WebView
          ref={mapRef}
          source={{ html: html_script }}
          style={styles.Webview}
          onShouldStartLoadWithRequest={(request) => {
            if (request.url !== "about:blank") {
              Linking.openURL(request.url);
              return false;
            } else return true;
          }}
        />
        <FAB //Center Button
          style={styles.centerButton}
          icon={{ type: "ionicon", name: "locate", color: "white" }}
          color="green"
          onPress={() => {
            centerOnPosition(ownLocation.lat, ownLocation.lng, 16);
            setMarker(OWN_MARKER, ownLocation.lat, ownLocation.lng);
          }}
        />
        <FAB //Route Button
          style={styles.routeButton}
          icon={{
            ...(isRouting
              ? { type: "ionicons", name: "close", color: "white" }
              : {
                  type: "feather",
                  name: "corner-up-right",
                  color: "white",
                }),
          }}
          color={routeButtonColor}
          disabled={!friendMarkerAdded}
          onPress={() => {
            if (!isRouting) {
              addRoute(
                ownLocation.lat,
                ownLocation.lng,
                friendLocation.lat,
                friendLocation.lng
              );
              setRouteButtonColor("red");
            } else {
              removeRoute();
              setRouteButtonColor("green");
            }
          }}
        />

        {isRouting && (
          <FAB //Directions Button
            style={styles.directionsButton}
            icon={{ type: "fontisto", name: "direction-sign", color: "white" }}
            color={directionsButtonColor}
            disabled={!friendMarkerAdded}
            onPress={() => {
              setIsShowingDirections(!isShowingDirections);
              if (isShowingDirections) {
                hideDirections();
                setDirectionsButtonColor("green");
              } else {
                showDirections();
                setDirectionsButtonColor("red");
              }
            }}
          />
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  Container: {
    flex: 1,
    padding: 0,
    backgroundColor: "grey",
    textAlign: "center",
  },
  Webview: {
    flex: 2,
  },
  centerButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    marginRight: 10,
    marginBottom: 10,
    height: 50,
    width: 50,
  },
  routeButton: {
    position: "absolute",
    right: 0,
    bottom: 60,
    marginRight: 10,
    marginBottom: 10,
    height: 50,
    width: 50,
  },
  directionsButton: {
    position: "absolute",
    right: 0,
    bottom: 120,
    marginRight: 10,
    marginBottom: 10,
    height: 50,
    width: 50,
  },
  compass: {
    height: 100,
    width: 100,
  },
  compassWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});

export default MapWebview;
