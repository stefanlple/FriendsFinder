import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  TextInput,
  Text,
  ImageBackground,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from "react-native";
import FriendPanel from "./friend-panel";
import MapWebview from "./map/map-webview";
import { FAB } from "@rneui/themed";
import RequestPopup from "./request-popup";
import axiosInstance from "../axios-instance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useInterval } from "../common/useIntervall";
import * as Contacts from "expo-contacts";
import { transformNumber } from "../common/transformNumber";
import { Icon } from "@rneui/themed";

const BaseLayout = () => {
  const [isLoading, setIsLoading] = useState(true);

  const [token, setToken] = useState(null);

  const [phoneNumber, setPhoneNumber] = useState("");

  const [showSidePanel, setShowSidePanel] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [pendingSyncRequests, setPendingSyncRequests] = useState([]);

  const [trackedFriend, setTrackedFriend] = useState(null);

  const [acceptedTracking, setAcceptedTracking] = useState(false);

  const [friendsTracking, setFriendsTracking] = useState([]);

  const [contacts, setContacts] = useState([]);

  const buildPayload = (data) => {
    return data.map((contact) =>
      contact.phoneNumbers[0].number.replaceAll(" ", "")
    );
  };

  const refreshContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });
      if (data.length > 0) {
        axiosInstance
          .post("/users/get-all-registered-friends", {
            listOfFriends: buildPayload(data),
          })
          .then((response) => {
            const filteredContacts = data.filter((contact) =>
              response.data.includes(
                transformNumber(contact.phoneNumbers[0].number)
              )
            );
            setContacts(filteredContacts);

            AsyncStorage.setItem("contacts", JSON.stringify(filteredContacts));
          })
          .catch((err) => console.log(err));
      }
    }
  };
  const setCachedContacts = async () => {
    const cachedContacts = JSON.parse(await AsyncStorage.getItem("contacts"));
    setContacts(cachedContacts);
  };

  const getContactNameByNumber = (number) => {
    const contact = contacts?.find(
      (contact) => transformNumber(contact.phoneNumbers[0].number) === number
    );
    return contact ? contact.name : number;
  };

  useEffect(() => {
    setCachedContacts();
    checkLoggedIn();
  }, []);

  async function checkLoggedIn() {
    const token = JSON.parse(await AsyncStorage.getItem("jwtToken"));
    if (token != null) {
      setToken(token);
    }
    setIsLoading(false);
  }

  useInterval(async () => {
    if (token) {
      const response = await axiosInstance.get(
        "/permission/get-request-from-friend",
        { headers: { Authorization: "Bearer " + token } }
      );
      if (response.data && response.data.length > 0) {
        setPendingSyncRequests(
          response.data.filter((request) => request.status === "pending")
        );
        const friendsTracking = response.data.filter(
          (request) => request.status === "accepted"
        );
        setFriendsTracking(
          friendsTracking?.map((friend) => ({
            number: friend.user,
            requestId: friend._id,
          }))
        );
      }
    }
  }, 10000);

  useInterval(async () => {
    if (trackedFriend && !acceptedTracking) {
      axiosInstance
        .post(
          "/permission/get-request",
          { friendsTelefon: trackedFriend.number },
          { headers: { Authorization: "Bearer " + token } }
        )
        .then((r) => {
          if (r.data.status === "accepted") {
            setAcceptedTracking(true);
            setTrackedFriend({
              number: trackedFriend.number,
              id: trackedFriend.id,
              status: "accepted",
            });
          }
          if (r.data.status === "declined") {
            setTrackedFriend(null);
          }
        });
    }
  }, 5000);

  const locationRequest = (number) => {
    axiosInstance
      .post(
        "/permission/permission-request",
        { friendsTelefon: number },
        { headers: { Authorization: "Bearer " + token } }
      )
      .then((r) => {
        setTrackedFriend({
          number: number,
          status: r.data.status,
          id: r.data._id,
        });
      });
  };

  const login = () => {
    axiosInstance
      .post("/users/login", { telefon: phoneNumber })
      .then((r) => {
        AsyncStorage.setItem("jwtToken", JSON.stringify(r.data.token));
        setToken(JSON.stringify(r.data.token));
      })
      .catch((err) => console.log(err));
  };

  const togglePanel = () => {
    setShowSidePanel(!showSidePanel);
  };

  const acceptRequest = (request, accepted) => {
    if (accepted) {
      axiosInstance
        .post(
          "/permission/accept-request",
          { id: request._id },
          { headers: { Authorization: "Bearer " + token } }
        )
        .then((r) => {
          setFriendsTracking([
            ...friendsTracking,
            { number: r.data.user, requestId: request._id },
          ]);
          setPendingSyncRequests(pendingSyncRequests.slice(1));
        });
    } else {
      setPendingSyncRequests(pendingSyncRequests.slice(1));
      axiosInstance.post(
        "/permission/decline-request",
        { id: request._id },
        { headers: { Authorization: "Bearer " + token } }
      );
    }
  };

  const stopGettingTracked = () => {
    axiosInstance
      .delete("/permission/delete-all-request", {
        headers: { Authorization: "Bearer " + token },
      })
      .then((r) => {
        setFriendsTracking([]);
      });
  };

  useEffect(() => {
    if (pendingSyncRequests && pendingSyncRequests.length > 0) {
      setModalVisible(true);
    } else {
      setModalVisible(false);
    }
  }, [pendingSyncRequests]);

  if (isLoading) {
    return (
      <ImageBackground
        source={require("../assets/splashScreen.jpg")}
        resizeMode="contain"
        style={{ flex: 1 }}
      />
    );
  }

  if (!token && !isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
          }}
        >
          <ImageBackground
            source={require("../background.png")}
            resizeMode="cover"
            style={{ flex: 1 }}
          >
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingHeader}> Welcome!</Text>
              <Text style={styles.greetingText}>
                Please enter your phone number so your friends are able to
                request your location:
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+49123456789 / 0123456789"
                  placeholderTextColor={"#d3d3d3"}
                ></TextInput>
                <View style={{ transform: [{ rotate: `45deg` }] }}>
                  <Icon
                    type="feather"
                    name="send"
                    color="white"
                    onPress={login}
                  />
                </View>
              </View>
            </View>
          </ImageBackground>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.baseLayout}>
      <View style={{ flex: 1 }}>
        <FAB //Friends Button
          style={styles.friendsButton}
          icon={{ type: "ionicons", name: "people", color: "white" }}
          color={showSidePanel ? "red" : "green"}
          onPress={togglePanel}
        />
        <RequestPopup
          style={styles.popup}
          modalVisible={modalVisible}
          syncRequests={pendingSyncRequests}
          acceptRequest={acceptRequest}
          request={pendingSyncRequests[0]}
          getName={getContactNameByNumber}
        />

        {showSidePanel && (
          <FriendPanel
            style={styles.panel}
            token={token}
            contacts={contacts}
            refreshContacts={refreshContacts}
            trackedFriend={trackedFriend}
            setTrackedFriend={setTrackedFriend}
            friendsTracking={friendsTracking}
            setFriendsTracking={setFriendsTracking}
            trackFriend={locationRequest}
          />
        )}

        <MapWebview
          trackedFriend={trackedFriend}
          setTrackedFriend={setTrackedFriend}
          token={token}
          setAcceptedTracking={setAcceptedTracking}
          getContactNameByNumber={getContactNameByNumber}
        />

        {friendsTracking.length > 0 && (
          <FAB //Stop getting tracked button
            style={styles.stopGettingTrackedButton}
            icon={{
              type: "material",
              name: "location-disabled",
              color: "white",
            }}
            color="red"
            onPress={stopGettingTracked}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  baseLayout: {
    flex: 1,
    zIndex: 0,
  },
  greetingContainer: {
    marginTop: "20%",
    marginLeft: "5%",
    marginRight: "5%",
    padding: "5%",
    backgroundColor: "#00000088",
    borderRadius: 10,
  },
  greetingHeader: {
    textAlign: "center",
    fontSize: 60,
    color: "white",
  },
  greetingText: {
    textAlign: "center",
    fontSize: 16,
    color: "white",
  },
  inputContainer: {
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "#b3b3b3",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: "5%",
  },
  phoneInput: {
    marginTop: 0,
    textAlign: "center",
    color: "white",
    fontSize: 16,
    width: "88%",
  },
  panel: {
    position: "absolute",
    zIndex: 2,
    height: "100%",
    width: "33%",
  },
  friendsButton: {
    position: "absolute",
    right: 0,
    top: 0,
    marginRight: 10,
    marginTop: 10,
    height: 50,
    width: 50,
    zIndex: 1,
  },
  stopGettingTrackedButton: {
    position: "absolute",
    right: 0,
    top: 60,
    marginRight: 10,
    marginTop: 10,
    height: 50,
    width: 50,
    zIndex: 1,
  },
});

export default BaseLayout;
