// // server.js
// const express = require("express");
// const app = express();

// app.use(express.json());

// // 라벨 목록 API
// app.get("/api/labels", (req, res) => {
//   const labels = [
//     { tripId: 1, label: "서울 여행" },
//     { tripId: 2, label: "부산 여행" },
//     { tripId: 3, label: "제주도 여행" },
//     { tripId: 4, label: "강릉 여행" },
//     { tripId: 5, label: "인천 여행" },
//   ];
//   res.json(labels);
// });

// // tripId + 사용자 정보 받기
// app.post("/api/select-trip", (req, res) => {
//   const { tripId, userId, userName } = req.body;
//   console.log("선택된 tripId:", tripId);
//   console.log("사용자 정보:", userId, userName);

//   // DB 저장이나 추가 로직 수행
//   res.json({ success: true, tripId, userId, userName });
// });

// app.listen(5000, () => {
//   console.log("Server running on http://localhost:5000");
// });





import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RadioButton } from "react-native-paper";
import instance from "../../api/axiosInstance";

export default function UploadScreen() {
  const router = useRouter();
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [radioValues, setRadioValues] = useState<boolean[]>([]);
  const [labels, setLabels] = useState<{ tripId: number; label: string }[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [userInfo, setUserInfo] = useState<{ userId: string; userName: string } | null>(null);

  // ✅ 사용자 정보 불러오기
  useEffect(() => {
    const loadUserInfo = async () => {
      const session = await SecureStore.getItemAsync("userSession");
      if (session) {
        const parsed = JSON.parse(session);
        setUserInfo({ userId: parsed.userId, userName: parsed.userName });
      }
    };
    loadUserInfo();
  }, []);

  // ✅ 서버에서 라벨 받아오기
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const response = await instance.get("/api/labels");
        setLabels(response.data);
        setRadioValues(Array(response.data.length).fill(false));
      } catch (error) {
        console.error("라벨 불러오기 실패:", error);
      }
    };
    fetchLabels();
  }, []);

  const handleRadioChange = (index: number) => {
    const newValues = Array(labels.length).fill(false);
    newValues[index] = true;
    setRadioValues(newValues);
    setSelectedTripId(labels[index].tripId);
  };

  // ✅ tripId + 사용자 정보 서버로 보내기
  const sendSelectedTrip = async () => {
    if (!selectedTripId || !userInfo) {
      Alert.alert("알림", "사용자 정보와 tripId를 확인해주세요.");
      return;
    }
    try {
      const response = await instance.post("/api/select-trip", {
        tripId: selectedTripId,
        userId: userInfo.userId,
        userName: userInfo.userName,
      });
      Alert.alert("성공", `tripId ${selectedTripId} + 사용자 정보 전송 완료`);
      console.log(response.data);
    } catch (error) {
      console.error("tripId 전송 실패:", error);
      Alert.alert("실패", "서버 연결 상태를 확인하세요.");
    }
  };

  const handleLogout = async () => {
    try {
      await instance.post("http://192.168.45.16:5000/api/logout");
    } catch (e) {
      console.log("로그아웃 요청 에러:", e);
    } finally {
      await SecureStore.deleteItemAsync("userSession");
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

    const formData = new FormData();
    formData.append("file", {
      uri: image.uri,
      name: image.fileName || "upload.jpg",
      type: "image/jpeg",
    } as any);

    try {
      const response = await instance.post("http://s:5000/api/upload", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("성공", "서버에 저장되었습니다!");
      console.log(response.data);
    } catch (error: any) {
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={{ fontWeight: "bold" }}>
            {isOpen ? "닫기 ▼" : "열기 ▶"}
          </Text>
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.dropdownContent}>
            {labels.map((item, index) => (
              <View key={item.tripId} style={styles.radioItem}>
                <RadioButton
                  value={`radio${item.tripId}`}
                  status={radioValues[index] ? "checked" : "unchecked"}
                  onPress={() => handleRadioChange(index)}
                />
                <Text style={styles.textLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.logoutWrapper}>
          <Button title="로그아웃" onPress={handleLogout} color="red" />
        </View>
      </View>

      <Button title="사진 선택하기" onPress={pickImage} />
      {image && <Image source={{ uri: image.uri }} style={styles.image} />}
      <Button title="서버로 전송" onPress={uploadImage} color="#007AFF" />
      <Button
        title="선택된 tripId + 사용자 정보 보내기"
        onPress={sendSelectedTrip}
        color="green"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { padding: 10, backgroundColor: "#f0f0f0" },
  dropdownButton: {
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 5,
  },
  dropdownContent: {
    flexDirection: "column",
    marginTop: 10,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  textLabel: {
    fontSize: 14,
    color: "#333",
    marginLeft: 5,
  },
  image: { width: 300, height: 300, borderRadius: 10 },
  logoutWrapper: { position: "absolute", top: 50, right: 20 },
});

