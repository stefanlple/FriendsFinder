import { FlatList, View } from "react-native";
import FriendItem from "./friend-item";
import { StyleSheet } from "react-native";
import { Icon } from "@rneui/themed";


const FriendPanel = ( { style, contacts, refreshContacts, token, trackedFriend, setTrackedFriend, friendsTracking, setFriendsTracking, trackFriend } ) => {

    return (
            <View style={ style }>
                <Icon
                        type="ionicons"
                        name="refresh"
                        color="white"
                        size={ 30 }
                        style={ styles.refreshButton }
                        onPress={ refreshContacts }
                />
                <View style={ styles.sidebar }>
                    <FlatList
                            data={ contacts }
                            renderItem={ ( { item } ) => <FriendItem friendData={ item } trackedFriend={ trackedFriend }
                                                                     setTrackedFriend={ setTrackedFriend } token={ token }
                                                                     friendsTracking={ friendsTracking }
                                                                     setFriendsTracking={ setFriendsTracking }
                                                                     trackFriend={ trackFriend }/> }
                            keyExtractor={ ( item, index ) => index.toString() }
                    />

                </View>
            </View>
    );
};


const styles = StyleSheet.create( {
    sidebar: {
        height: "100%",
        borderBottomRightRadius: 10,
        marginLeft: 0,
        backgroundColor: "#00000088"
    },
    refreshButton: {
        resizeMode: "contain",
        backgroundColor: "#00000088",
        borderTopRightRadius: 10,
        paddingTop: 5,
        paddingBottom: 5,
        borderBottomWidth: 3,
        borderBottomColor: "#b3b3b3"
    }
} );

export default FriendPanel;