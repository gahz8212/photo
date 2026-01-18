import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router"; // 1. 라우터 추가
import * as SecureStore from "expo-secure-store"; // 2. 저장소 삭제용
import React, { useState } from "react";
import {
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { RadioButton } from "react-native-paper";

import instance from "../../api/axiosInstance";

export default function UploadScreen() {
  const router = useRouter(); // 라우터 객체 생성
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [radioValues, setRadioValues] = useState(Array(5).fill(false));
  const [texts, setTexts] = useState(Array(5).fill(""));

  const handleRadioChange = (index: number) => {
    const newValues = Array(5).fill(false);
    newValues[index] = true;
    setRadioValues(newValues);
  };

  // --- 로그아웃 함수 추가 ---
  const handleLogout = async () => {
    try {
      // 1. (선택사항) 서버에 로그아웃 요청을 보내 세션 파괴
      await instance.post("http://192.168.45.16:5000/api/logout");
    } catch (e) {
      console.log("로그아웃 요청 에러(무시 가능):", e);
    } finally {
      // 2. 기기에 저장된 유저 정보 삭제
      await SecureStore.deleteItemAsync("userSession");

      // 3. 로그인 화면(index)으로 이동
      Alert.alert("로그아웃", "정상적으로 로그아웃 되었습니다.");
      router.replace("/");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const uploadImage = async () => {
    if (!image) {
      Alert.alert("알림", "먼저 사진을 선택해주세요.");
      return;
    }

    console.log(image);
    const formData = new FormData();

    formData.append("file", {
      uri: image.uri,
      name: image.fileName || "upload.jpg",
      type: "image/jpeg",
    } as any);
    try {
      // 여기서 세션이 만료(Redis TTL 만료)되었다면
      // axiosInstance의 interceptor가 401을 감지하여 자동으로 index로 보낼 것입니다.
      const response = await instance.post(
        "http://192.168.45.66:5000/api/upload",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      Alert.alert("성공", "서버에 저장되었습니다!");
      console.log(response.data);
    } catch (error: any) {
      // 만약 인터셉터에서 처리를 안 했다면 여기서 직접 처리도 가능합니다.
      if (error.response?.status === 401) {
        Alert.alert("세션 만료", "다시 로그인해주세요.");
        router.replace("/");
      } else {
        console.error(error);
        Alert.alert("실패", "서버 연결 상태를 확인하세요.");
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.logoutWrapper}>
          <Button title="로그아웃" onPress={handleLogout} color="red" />
        </View>
        {/* 드롭다운 버튼 */}
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={{ fontWeight: "bold" }}>
            {isOpen ? "닫기 ▼" : "열기 ▶"}
          </Text>
        </TouchableOpacity>

        {/* 드롭다운 내부 */}
        {isOpen && (
          <View style={styles.dropdownContent}>
            {texts.map((text, index) => (
              <View key={index} style={styles.radioItem}>
                <RadioButton
                  value={`radio${index}`}
                  status={radioValues[index] ? "checked" : "unchecked"}
                  onPress={() => handleRadioChange(index)}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder={`텍스트 ${index + 1}`}
                  value={text}
                  onChangeText={(val) => {
                    const newTexts = [...texts];
                    newTexts[index] = val;
                    setTexts(newTexts);
                  }}
                />
              </View>
            ))}
          </View>
        )}
      </View>
      <Button title="사진 선택하기" onPress={pickImage} />

      {image && <Image source={{ uri: image.uri }} style={styles.image} />}

      <Button title="서버로 전송" onPress={uploadImage} color="#007AFF" />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: {
    padding: 10,
    backgroundColor: "#f0f0f0",
  },
  dropdownButton: {
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 5,
  },
  dropdownContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  radioItem: {
    alignItems: "center",
    width: 60,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    width: 50,
    height: 30,
    paddingHorizontal: 5,
    fontSize: 12,
  },
  image: { width: 300, height: 300, borderRadius: 10 },
  logoutWrapper: { position: "absolute", top: 50, right: 20 }, // 로그아웃 버튼 위치
});
//   return (
//     <View style={styles.container}>
//       {/* 상단 로그아웃 버튼 */}
//       <View style={styles.logoutWrapper}>
//         <Button title="로그아웃" onPress={handleLogout} color="red" />
//       </View>

//       <Button title="사진 선택하기" onPress={pickImage} />

//       {image && <Image source={{ uri: image.uri }} style={styles.image} />}

//       <Button title="서버로 전송" onPress={uploadImage} color="#007AFF" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 20,
//   },
//   image: { width: 300, height: 300, borderRadius: 10 },
//   logoutWrapper: { position: "absolute", top: 50, right: 20 }, // 로그아웃 버튼 위치
// });
