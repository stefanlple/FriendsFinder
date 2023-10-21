import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, Alert } from "react-native";
import { LeafletView } from "../react-native-leaflet-expo-main/src"; //Grüße gehen raus an "lichtmetzger" von github, der mit seinem fork von react-native-leaflet-view den Fehler gefixt hat, der mich in die Verzweiflung getrieben hat
import * as Location from "expo-location"

const DEFAULT_COORDINATE = {
  lat: 37.78825,
  lng: -122.4324,
};

const Map = () => {

  const [ownLocation, setOwnLocation] = useState({
    lat: 37.78825,
    lng: -122.4324,
  });
  
  const verifyPermissions = async () => {
    const result = await Location.requestForegroundPermissionsAsync();
    if (result.status !== "granted") {
        Alert.alert("No Permissions!", "Please give location permissions to use this app.", [{title: "Ok"}]);
        return false;
    } else {
        return true;
    }
  };

  const getLocationHandler = async () => {
    const hasPermission = await verifyPermissions();
    if (!hasPermission) {
        return
    }
    try {
        const location = await Location.getCurrentPositionAsync({timeout: 5000});
        setOwnLocation({lat: location.coords.latitude, lng: location.coords.longitude});
    } catch (err) {
        Alert.alert("Could not get location!", "Please try again later and make sure your location is enabled", [{title: "Ok"}]);
    }
  };

  getLocationHandler();

  return ( 
    <SafeAreaView style={styles.root}>
      <LeafletView
        mapMarkers={[
          {
            position: DEFAULT_COORDINATE,
            icon: '📍',
            size: [32, 32],
          },
          
          {
            position: ownLocation,
            icon: '🧍‍♂️',
            size: [32, 32],
          },
          
        ]}
        mapCenterPosition={ownLocation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    Container: {
        flex: 1,
        padding: 10,
        backgroundColor: "grey",
      },
      Webview: {
        flex: 1,
      },
      root: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
});

export default Map;