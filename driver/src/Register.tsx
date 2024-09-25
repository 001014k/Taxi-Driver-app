import { SafeAreaView, StyleSheet, Text, TouchableOpacity, TextInput, View, Alert} from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import { useState } from "react";
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { StackNavigationProp} from '@react-navigation/stack';
import api from './API'
import AsyncStorage from "@react-native-async-storage/async-storage";



function Register(): JSX.Element {
    console.log("--Register()")

    const [userId, setUserId] = useState('');
    const [userPw, setUserPw] = useState('');
    const [userPw2, setUserPw2] = useState('');

    const isDisable = () => {
        if (userId && userPw && userPw2 && (userPw == userPw2)) {
            return false
        } else {
            return true
        }
    }

    const navigation = useNavigation<StackNavigationProp<ParamListBase>>()
    const onRegister = async () => {
        let fcmToken = await AsyncStorage.getItem('fcmToken') || ""
        api.register(userId, userPw, `${fcmToken}`)
        .then(response => {
            let {code, message} = response.data[0]
            let title = "알림"
            if (code == 0) {
                //회원가입이 완료되었으니 로그인 화면으로
                navigation.pop()
            }else{
                title = "오류"
            }

            //성공이든 실패든 Alert을 띄워준다
            Alert.alert(title, message, [{
                text:'확인',
                onPress: () => console.log('Cancel pressed'),
                style: 'cancel',
            }]);
        })
        .catch(err => {
            console.log(JSON.stringify(err))
        })
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.container}>
            <Icon name="drivers-license" size={80} color={'#3498db'} />
            </View>
            <View style={[styles.container, {flex: 2}]}>
                <TextInput style={styles.input} placeholder={'아이디'} onChangeText={newId => setUserId(newId)}/>
                <TextInput style={styles.input} placeholder={'비밀번호'} secureTextEntry={true} onChangeText={newPw => setUserPw(newPw)} />
                <TextInput style={styles.input} placeholder={'비밀번호 확인'} secureTextEntry={true} onChangeText={newPw2 => setUserPw2(newPw2)} />
            </View>
            <View style={[styles.container, {justifyContent: 'flex-start'}]}>
                <TouchableOpacity disabled={isDisable()} onPress={onRegister} style={isDisable() ? styles.buttonDisable : styles.button}>
                    <Text style = {styles.buttonText}>회원가입</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center', //자식 요소들을 수직으로 중앙정렬
        alignItems: 'center', // 자식 요소들을 수푱으로 중앙정렬
        width: '100%', // 부모 요소의 폭을 100% 사용함
    },
    input: {
        width: '70%', // 입력란의 너비 조정
        height: 40, // 입력란의 높이 조정
        borderWidth: 1,
        borderColor: 'gray',
        marginVertical: 10, // 상하 여백 조정
        padding: 10,
    },
    button: {
        width: '70%', // 폭 70%
        backgroundColor: '#3498db', // 버튼 배경색상
        paddingVertical: 10, // 수직 여백
        paddingHorizontal: 20, // 수평 여백
        borderRadius: 5, // 버튼 모서리 둥글기
    },
    buttonDisable: {
        width: '70%', // 폭 70%
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


export default Register;