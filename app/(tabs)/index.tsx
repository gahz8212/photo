import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import instance from "../../api/axiosInstance"; // 아까 만든 axios 인스턴스 파일

export default function LoginScreen() {
  const [email, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("알림", "이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. axios 인스턴스를 사용한 로그인 요청
      const response = await instance.post(
        "http://192.168.45.66:5000/api/users/login",
        {
          email: email,
          password: password,
        },
      );
      // const response = await instance.post('http://192.168.45.76:5000/api/users/login', {
      //   email: email,
      //   password: password,
      // });

      // 2. 로그인 성공 처리
      if (response.status === 200) {
        const userObj = response.data.user;
        console.log(response.data.user);
        // Alert.alert(response.data)
        await SecureStore.setItemAsync("userSession", JSON.stringify(userObj));

        Alert.alert("성공", "환영합니다!", [
          {
            text: "확인",
            onPress: () => {
              // 3. Upload 화면으로 이동 (스택 교체)
              // 'replace'를 쓰면 로그인 화면이 뒤로가기 스택에서 사라집니다.
              router.replace("/upload");
            },
          },
        ]);
      }
    } catch (error: any) {
      // 3. 에러 처리
      const message =
        error.response?.data?.message || "서버와 통신 중 오류가 발생했습니다.";
      Alert.alert("로그인 실패", message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.loginBox}>
        <View style={stylesLogo.logo}>
          <Image
            source={require("../../assets/images/tripy.png")}
            style={stylesLogo.localImage}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="email"
          value={email}
          onChangeText={setUserEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry // 비밀번호 숨기기
        />

        <TouchableOpacity
          style={[styles.button, isLoading && { backgroundColor: "#ccc" }]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "로그인 중..." : "로그인"}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text>회원가입은 PC에서 가능</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    padding: 20,
  },
  loginBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    elevation: 5,
  }, // elevation은 안드로이드 그림자
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#fafafa",
  },
  button: {
    height: 50,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  link: { color: "#007AFF", fontWeight: "bold" },
});
const stylesLogo = StyleSheet.create({
  logo: { justifyContent: "center", alignItems: "center" },
  localImage: { width: 180, height: 100 },
});
