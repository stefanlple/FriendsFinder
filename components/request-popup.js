import React from "react";
import { StyleSheet, View, Modal, Text } from "react-native";
import { Icon } from "@rneui/themed";


const RequestPopup = ( { style, modalVisible, acceptRequest, request, getName } ) => {

    return (
            <Modal style={ style } animationType={ "slide" } visible={ modalVisible } transparent={ true }>
                <View style={ styles.container }>
                    <Text style={ styles.text }>Allow { "\n" }{ getName( request?.user ) }{ "\n" } to get your location?</Text>
                    <View style={ styles.container2 }>
                        <View style={ styles.declineContainer }>
                            <Icon
                                    type="feather"
                                    name="x"
                                    color="red"
                                    size={ 60 }
                                    onPress={ () => acceptRequest( request, false ) }
                            />
                        </View>
                        <View style={ styles.acceptContainer }>
                            <Icon
                                type="feather"
                                name="check"
                                color="#3abd20"
                                size={60}
                                onPress={ () => acceptRequest( request, true ) }
                            />
                        </View>
                    </View>
                </View>
            </Modal>
    );
};
const styles = StyleSheet.create( {
    container: {
        marginTop: "70%",
        marginLeft: "15%",
        alignItems: "center",
        width: "70%",
        height: "30%",
        flexDirection: "column",
        backgroundColor: "#00000088",
        borderRadius: 10
    },
    container2: {
        flexDirection: "row",
        padding: "5%"
    },
    text: {
        fontSize: 20,
        color: "white",
        textAlign: "center",
        marginTop: "5%"
    },
    declineContainer: {
        width: "50%",
        paddingLeft: "10%"
    },
    acceptContainer: {
        width: "50%",
        paddingRight: "10%"
    }
} );


export default RequestPopup;