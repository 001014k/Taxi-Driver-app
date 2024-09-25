import { SafeAreaView, StyleSheet, Text, TouchableOpacity, Modal, View, Alert} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, ParamListBase } from '@react-navigation/native';
import api from './API'
import Icon from 'react-native-vector-icons/FontAwesome';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useState, useRef } from "react";
import MapView, {PROVIDER_GOOGLE, Marker, Polyline} from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import Geolocation from "@react-native-community/geolocation";

function Main_Map(): JSX.Element {
    console.log("--Main_Map()")

    const [marker1, setMarker1] = useState({latitude: 0, longitude: 0});
    const [marker2, setMarker2] = useState({latitude: 0, longitude: 0});

    const onSelectAddr = (data: any, details: any, type: string) => {
        if(details) {
            let lat = details.geometry.location.lat
            let lng = details.geometry.location.lng
            // 검색 위치에 마커
            if(type == "start") {
                setMarker1({ latitude: lat, longitude: lng})
                if(marker2.longitude == 0) {
                    setInitialRegion({ // 검색 위치를 중앙으로
                        latitude: lat, longitude: lng,
                        latitudeDelta: 0.0073, longitudeDelta: 0.0064, //최대 확대
                    })
                }
            }else {
                setMarker2({ latitude: lat, longitude: lng})
                if(marker1.longitude == 0) {
                    setInitialRegion({ // 검색 위치를 중앙으로
                        latitude: lat, longitude: lng,
                        latitudeDelta: 0.0073, longitudeDelta: 0.0064, //최대 확대
                    })
                }
            }
        }
    }

    const mapRef: any = useRef(null);

    if(marker1.latitude != 0 && marker2.longitude != 0) {
        if(mapRef.current) {
            mapRef.current.fitToCoordinates([marker1, marker2], {
                edgePadding: { top: 120, right: 50, bottom: 50, left: 50},
                animated: true
            })
        }
    }

    const [showbtn, setshowBtn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedLatLng, setSelectedLatLng] = useState ({latitude:0,longitude:0})
    const [selectedAddress, setSelectedAddress] = useState('')
    const handleLongPress = async (event: any) => {
        const { coordinate } = event.nativeEvent;
        setSelectedLatLng(coordinate)
        setLoading(true)
        
        api.geoCoding(coordinate, query.key)
        .then(response => {
            setSelectedAddress(response.data.result[0].formatted_address)
            setshowBtn(true)
            setLoading(false)
        })
        .catch(err => {
            console.log(JSON.stringify(err))
            setLoading(false)
        })
    }
    const autocomplete1: any = useRef(null)
    const autocomplete2: any = useRef(null)

    const handleAddMarker = (title: string) => {
        if(selectedAddress) {
            if(title == "출발지") {
                setMarker1(selectedLatLng)
                if(autocomplete1.current){
                    autocomplete1.current.setAddressText(selectedAddress)
                }
            } else {
                setMarker2(selectedLatLng)
                if(autocomplete2.current){
                    autocomplete2.current.setAddressText(selectedAddress)
                }
            }
        }
        setshowBtn(false)
    }
    const [initialRegion, setInitialRegion] = useState({
        latitude: 37.5666612,
        longitude: 126.9783785,  // 오타 수정
        latitudeDelta: 0.0922,  // 오타 수정
        longitudeDelta: 0.0421,  // 오타 수정
    });
    let query = {
        key: "AIzaSyDm523TKBZ_pOFCLYeRlB0x3s3DuZ9_nyc",
        language: "ko",
        components: "country:kr",
    }
    const setMyLocation = () => {
        setLoading(true);
        Geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;

            let coords = {latitude,longitude}
            setMarker1(coords) //출발지 마커 찍기
            setInitialRegion({latitude: 0, longitude: 0,
            latitudeDelta: 0, longitudeDelta: 0})
            setInitialRegion({latitude: latitude, longitude: longitude,
                latitudeDelta: 0.0073, longitudeDelta: 0.0064,
            })

            api.geoCoding(coords,query.key)
            .then(response => {
                let addr = response.data.results[0].formatted_address
                autocomplete1.current.setAddressText(addr) // 출발지에 주소입력
                setLoading(false)
            })
            .catch(err => {
                console.log(JSON.stringify(err))
                setLoading(false)
            })
        },
        (error) => {
            setLoading(false);
            console.log("!!!! 오류 발생 / error = " + JSON.stringify(error))
        },
        {
            enableHighAccuracy: false, // 공기계인 경우에는 true 하면 오류 발생함
            timeout : 10000, // 위치정보를 가져오는데 허용되는 시간(밀리초).
            maximumAge: 1000, // 캐시된 위치 정보를 사용할 수 있는 최대 시간 (밀리초).
        }
        );
    }

    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    const callTaxi = async () => {
        let userId = await AsyncStorage.getItem('userId') || ""
        let startAddr = autocomplete1.current.getAddressText()
        let endAddr = autocomplete2.current.getAddressText()
        // 위도/경도는 숫자 type이기 때문에 문자열로 변횐해서 사용
        let startLat = `${marker1.latitude}`
        let startLng = `${marker1.latitude}`
        let endLat = `${marker2.latitude}`
        let endLng = `${marker2.latitude}`

        if (!(startAddr && endAddr)) {
            Alert.alert("알림","출발지 / 도착지가 모두 입력되어야합니다.", [
                { text: '확인', style: 'cancel'},
            ]);
            return
        }

        api.call(userId, startLat, startLng, startAddr, endLat, endLng, endAddr)
        .then(response => {
            let {code, message} = response.data[0]
            let title = "알림"
            if (code == 0) { // 호출이 정상이라면 목록 화면으로
                navigation.navigate('Main_List')
            }else { title = "오류"}

            //성공이든 실패든 팝업을 띄워준다
            Alert.alert(title, message, [
                {text: '확인', style: 'cancel'}]);
        })
        .catch(err => { console.log(JSON.stringify(err))})
    }

    return (
        <SafeAreaView style ={styles.container}>
            {/*지도*/}
            <MapView style={styles.container} provider={PROVIDER_GOOGLE}
                onPress={() => {setshowBtn(false)}}
                region={initialRegion} ref={mapRef} onLongPress={handleLongPress}>
                <Marker coordinate={marker1} title="출발 위치" />
                <Marker coordinate={marker2} title="도착 위치" pinColor='blue' />
                {marker1.latitude != 0 && marker2.longitude != 0 && (
                    <Polyline
                    coordinates={[marker1,marker2]}
                    strokeColor="blue" strokeWidth={3} />
                )}
            </MapView>

            {/*지도 위에 얹을 컴포넌트들*/}
            <View style={{position: 'absolute', width: '100%', height:'100%'}}>
                {/*출발지/도착지 입력 박스,호출버튼*/}
                <View style={{position: 'absolute', padding: wp(2)}}>
                    <View style={{width: wp(75)}}>
                        <GooglePlacesAutocomplete ref={autocomplete1}
                        onPress={(data, details) => onSelectAddr(data, details, 'start')}
                        minLength={2} placeholder="출발지 검색" query={query}
                        keyboardShouldPersistTaps={"handled"}
                        fetchDetails={true} enablePoweredByContainer={false}
                        onFail={(error) => console.log(error)}
                        onNotFound={() => console.log("no result")}
                        styles={{autocompleteStyles}} />
                    </View>
                    <View style={{width: wp(75)}}>
                        <GooglePlacesAutocomplete ref={autocomplete2}
                        onPress={(data, details) => onSelectAddr(data, details, 'end')}
                        minLength={2} placeholder="도착지 검색" query={query}
                        keyboardShouldPersistTaps={"handled"}
                        fetchDetails={true} enablePoweredByContainer={false}
                        onFail={(error) => console.log(error)}
                        onNotFound={() => console.log("no result")}
                        styles={{autocompleteStyles}} />
                    </View>
                </View>
                <TouchableOpacity style={[styles.button,{position: 'absolute', width: wp(18), top: wp(2), right: wp(2), height: 90, justifyContent: 'center'}]} onPress={callTaxi}>
                    <Text style={styles.buttonText}>호출</Text>
                </TouchableOpacity>
                
                {/*내 위치로 버튼*/}
                <TouchableOpacity style={[{position: 'absolute', bottom: 20, right: 20}]} onPress={setMyLocation}>
                    <Icon name="crosshairs" size={40} color={'#3498db'} />
                </TouchableOpacity>
                {/*출발지 / 도착지 등록 버튼 팝업*/}
                {showbtn && <View style={{position:'absolute', top: hp(50)-45, left: wp(50)-75,height: 90,width: 150}}>
                    <TouchableOpacity style ={[styles.button,{flex: 1, marginVertical: 1}]}
                        onPress={() => handleAddMarker('출발지')}>
                        <Text style={styles.buttonText}>출발지로 등록</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style ={[styles.button,{flex: 1}]}
                         onPress={() => handleAddMarker('도착지')}>
                        <Text style={styles.buttonText}>도착지로 등록</Text>
                    </TouchableOpacity>
                </View> }
            </View>
            <Modal transparent={true} visible={loading}>
                <View style={{flex:1, justifyContent: 'center', alignItems:'center'}}>
                    <Icon name="spinner" size={50} color="blue" />
                    <Text style={{backgroundColor:'white', color: 'black', height: 20}}> Loading...</Text>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

const autocompleteStyles = StyleSheet.create({
    textInputContainer: {
        width: '100%',
        backgroundColor: '#e9e9e9',
        borderRadius: 8,
        height: 40
    },
    textInput: {
        height: 40,
        color: '#5d5d5d',
        fontSize: 16,
    },
    predefinedPlaceDescription: {
        color: '#1faadb',
        zIndex: 1,
    }
})

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center', //자식 요소들을 수직으로 중앙정렬
        alignItems: 'center', // 자식 요소들을 수푱으로 중앙정렬
        width: '100%', // 부모 요소의 폭을 100% 사용함
    },
    button: {
        backgroundColor: '#3498db', // 버튼 배경색상
        paddingVertical: 10, // 수직 여백
        paddingHorizontal: 20, // 수평 여백
        borderRadius: 5, // 버튼 모서리 둥글기
    },
    buttonDisable: {
        backgroundColor: 'gray', // 버튼 배경색상
        paddingVertical: 10, // 수직 여백
        paddingHorizontal: 20, // 수평 여백
        borderRadius: 5, // 버튼 모서리 둥글기
    },
    buttonText: {
        color: 'white', // 버튼 텍스트 색상
        fontSize: 16, // 버튼 텍스트 크기
        textAlign: 'center', // 텍스트 가운데 정렬
    }
})

export default Main_Map;