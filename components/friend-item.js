import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import axiosInstance from "../axios-instance";
import { useEffect, useState } from "react";
import { transformNumber } from "../common/transformNumber";
import { Icon } from "@rneui/themed";

const FriendItem = ( { friendData, trackedFriend, setTrackedFriend, friendsTracking, setFriendsTracking, trackFriend, token } ) => {

    const [ isTracked, setIsTracked ] = useState( false );

    const [ isTracking, setIsTracking ] = useState( false );

    useEffect( () => {
        if ( trackedFriend?.number === transformNumber( friendData.phoneNumbers[ 0 ].number ) ) {
            setIsTracked( true );
        } else {
            setIsTracked( false );
        }
    }, [ trackedFriend ] );

    useEffect( () => {
        if ( friendsTracking?.length > 0 &&
                friendsTracking.filter( friend => friend.number === transformNumber( friendData.phoneNumbers[ 0 ].number ) ).length > 0 ) {
            setIsTracking( true );
        } else {
            setIsTracking( false );
        }
    }, [ friendsTracking ] );


    const stopTracking = () => {
        axiosInstance.post( "/permission/decline-request", { id: trackedFriend.id }, { headers: { Authorization: "Bearer " + token } } )
                .then( () => {
                    setTrackedFriend( null );
                    setIsTracked( false );
                } );
    };


    const stopGettingTracked = () => {
        const friend = friendsTracking.find( friend => friend.number === transformNumber( friendData.phoneNumbers[ 0 ].number ) );
        axiosInstance.post( "/permission/decline-request", { id: friend.requestId }, { headers: { Authorization: "Bearer " + token } } );
        setFriendsTracking( friendsTracking.filter( friend => friend.number !== transformNumber( friendData.phoneNumbers[ 0 ].number ) ) );
        setIsTracking( false );
    };

    return (
            <View>
                <Text style={ styles.item }>{ friendData.name }</Text>
                <View style={ styles.iconContainer }>
                    <View style={ { flex: 1 } }>
                        { !isTracked &&
                                <Icon
                                        type="material"
                                        name="location-on"
                                        { ...trackedFriend?.status === "pending" ? { color: "#b3b3b3" } : { color: "white" } }
                                        size={ 30 }
                                        onPress={ () => trackFriend( transformNumber( friendData.phoneNumbers[ 0 ].number ) ) }
                                        disabled={ trackedFriend?.status === "pending" }
                                        disabledStyle={ styles.buttonDisabled }
                                />
                        }

                        { isTracked && trackedFriend?.status === "pending" &&
                                <ActivityIndicator
                                        color="white"
                                        size={ 30 }
                                />
                        }

                        { isTracked && trackedFriend?.status !== "pending" &&
                                <Icon
                                        type="material"
                                        name="location-off"
                                        color="white"
                                        size={ 30 }
                                        onPress={ stopTracking }
                                />
                        }
                    </View>
                    { isTracking &&
                            <View style={ { width: "50%" } }>
                                <Icon
                                        type="material"
                                        name="location-disabled"
                                        color="white"
                                        size={ 30 }
                                        onPress={ stopGettingTracked }
                                />
                            </View>
                    }
                </View>
            </View>
    );
};

const styles = StyleSheet.create( {
    item: {
        marginLeft: 10,
        marginTop: 5,
        color: "white"
    },
    iconContainer: {
        flexDirection: "row",
        paddingBottom: 5,
        borderBottomWidth: 3,
        borderBottomRightRadius: 5,
        borderBottomLeftRadius: 5,
        borderBottomColor: "#b3b3b3"
    },
    buttonDisabled: {
        backgroundColor: "transparent"
    }
} );
export default FriendItem;