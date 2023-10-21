import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { Magnetometer } from "expo-sensors";
import Icon from "react-native-vector-icons/Entypo";

Icon.loadFont();

const Compass = ({ ownLocation, friendLocation, distance }) => {
  const [subscription, setSubscription] = useState(null);
  const [magnetometer, setMagnetometer] = useState(0);

  useEffect(() => {
    _toggle();
    return () => {
      _unsubscribe();
    };
  }, []);

  const calculateDir = () => {
    const vector = [
      friendLocation.lng - ownLocation.lng,
      friendLocation.lat - ownLocation.lat,
    ];
    const theta = Math.atan2(vector[1], vector[0]);
    return theta * (180 / Math.PI) + 180;
  };

  const _toggle = () => {
    if (subscription) {
      _unsubscribe();
    } else {
      _subscribe();
    }
  };

  const _subscribe = () => {
    setSubscription(
      Magnetometer.addListener((data) => {
        setMagnetometer(_angle(data));
      })
    );
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  const _angle = (magnetometer) => {
    let angle = 0;
    if (magnetometer) {
      let { x, y, z } = magnetometer;
      angle = Math.atan2(y, x) * (180 / Math.PI);
      angle = (angle + 360) % 360;
      angle += 30;
    }
    return Math.round(angle);
  };

  return (
    <View
      style={{
        backgroundColor: "#00000088",
        borderRadius: 90,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        width: 60,
        height: 80,
        justifyContent: "flex-end",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: "white",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 11,
        }}
      >
        {distance}
      </Text>
      <View
        style={{
          borderRadius: 90,
          width: 60,
          height: 60,
          justifyContent: "center",
          alignItems: "center",
          transform: [
            { rotate: `${360 - (magnetometer + calculateDir())}deg` },
          ],
        }}
      >
        <Icon name="direction" color="white" size={30} />
      </View>
    </View>
  );
};

export default Compass;
