import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
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
  const [labels, setLabels] = useState<{ id: number; title: string }[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [userInfo, setUserInfo] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  // ✅ 초기 데이터 로딩 (사용자 정보 + 여행 목록)
  useEffect(() => {
    const initialize = async () => {
      try {
        const session = await SecureStore.getItemAsync("userSession");
        if (!session) return;

        const parsed = JSON.parse(session);
        const uid = parsed.id;

        setUserInfo({ userId: uid, userName: parsed.nickname });

        if (uid) {
          const response = await instance.get(`/labels/getTripTitle/${uid}`);
          const trips = response.data.trips;
          
          setLabels(trips);

          // 🚨 [수정] 초기 첫 번째 항목 자동 선택 로직
          if (trips && trips.length > 0) {
            const initialRadioValues = Array(trips.length).fill(false);
            initialRadioValues[0] = true; // 첫 번째 인덱스 선택
            setRadioValues(initialRadioValues);
            setSelectedTripId(trips[0].id); // 첫 번째 tripId 저장
          } else {
            setRadioValues([]);
          }
        }
      } catch (error) {
        console.error("데이터 로딩 중 에러 발생:", error);
      }
    };
    initialize();
  }, []);

  const handleRadioChange = (index: number) => {
    const newValues = Array(labels.length).fill(false);
    newValues[index] = true;
    setRadioValues(newValues);
    setSelectedTripId(labels[index].id);
    setIsOpen(false); // 선택 후 드롭다운 닫기
  };

  const handleLogout = async () => {
    try {
      await instance.post("/logout");
    } catch (e) {
      console.log("로그아웃 에러:", e);
    } finally {
      await SecureStore.deleteItemAsync("userSession");
      Alert.alert("알림", "로그아웃 되었습니다.");
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
    if (!selectedTripId) {
      Alert.alert("알림", "여행 목록에서 여행을 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", {
      uri: image.uri,
      name: image.fileName || "upload.jpg",
      type: "image/jpeg",
    } as any);
    formData.append("tripId", selectedTripId.toString());

    try {
      await instance.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("성공", "사진이 서버에 저장되었습니다!");
      setImage(null);
    } catch (error: any) {
      console.error(error);
      Alert.alert("실패", "서버 전송 중 오류가 발생했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. 상단 고정 헤더 영역 */}
      <View style={styles.header}>
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setIsOpen(!isOpen)}
          >
            <Text style={styles.dropdownButtonText}>
              {isOpen ? "여행 목록 닫기 ▲" : "여행 목록 선택 ▶"}
            </Text>
          </TouchableOpacity>

          {isOpen && (
            <View style={styles.dropdownContent}>
              <ScrollView style={styles.scrollViewStyle}>
                {labels.length > 0 ? (
                  labels.map((item, index) => (
                    // 🚨 [수정] TouchableOpacity로 감싸서 텍스트 클릭 시에도 선택되게 변경
                    <TouchableOpacity 
                      key={item.id} 
                      style={styles.radioItem}
                      onPress={() => handleRadioChange(index)}
                      activeOpacity={0.7}
                    >
                      <RadioButton
                        value={`${item.id}`}
                        status={radioValues[index] ? "checked" : "unchecked"}
                        onPress={() => handleRadioChange(index)}
                      />
                      <Text style={styles.textLabel}>{item.title}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noDataText}>목록이 없습니다.</Text>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* 2. 메인 컨텐츠 영역 */}
      <View style={styles.content}>
        <Text style={styles.title}>
          {selectedTripId
            ? `선택됨: ${labels.find((l) => l.id === selectedTripId)?.title}`
            : "여행을 먼저 선택해주세요"}
        </Text>

        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
          <Text style={styles.imagePickerText}>사진 선택하기</Text>
        </TouchableOpacity>

        {image && (
          <View style={styles.uploadSection}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: image.uri }} style={styles.image} />
            </View>

            <TouchableOpacity style={styles.uploadBtn} onPress={uploadImage}>
              <Text style={styles.uploadBtnText}>사진 서버로 전송하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    marginTop: 100,
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    zIndex: 1000,
  },
  dropdownWrapper: {
    flex: 1,
  },
  dropdownButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  dropdownButtonText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  dropdownContent: {
    position: "absolute",
    top: 45,
    left: 0,
    minWidth: 180,
    maxWidth: 250,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 5,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  scrollViewStyle: {
    maxHeight: 250,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5, // 터치 영역을 좀 더 확보
    paddingHorizontal: 5,
  },
  textLabel: {
    fontSize: 14,
    color: "#333",
    flexShrink: 1,
    marginLeft: 5,
  },
  noDataText: {
    padding: 10,
    color: "#999",
    textAlign: "center",
  },
  logoutBtn: {
    backgroundColor: "#ff4d4d",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 15,
    color: "#444",
  },
  imagePickerBtn: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    width: 300,
    alignItems: "center",
    marginBottom: 10,
  },
  imagePickerText: {
    color: "#fff",
    fontWeight: "bold",
  },
  uploadSection: {
    alignItems: "center",
    marginTop: 10,
  },
  imageWrapper: {
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  image: {
    width: 300,
    height: 300,
  },
  uploadBtn: {
    backgroundColor: "#34C759",
    padding: 15,
    borderRadius: 10,
    width: 300,
    marginTop: 15,
    alignItems: "center",
  },
  uploadBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});