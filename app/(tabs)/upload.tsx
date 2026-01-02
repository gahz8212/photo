import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Button, Image, StyleSheet, View, } from 'react-native';
import instance from '../../api/axiosInstance';

export default function App() {
  // 상태 타입 지정: 사진 객체 또는 null
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const pickImage = async () => {
    // 갤러리 접근 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      // 수정된 부분: MediaTypeOptions -> MediaType 사용
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const uploadImage = async () => {
    if (!image) {
      Alert.alert('알림', '먼저 사진을 선택해주세요.');
      return;
    }

    const formData = new FormData();
    // 타입스크립트 형변환을 위해 'as any' 사용
    formData.append('image', {
      uri: image.uri,
      name: image.fileName || 'upload.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      const response = await instance.post(
        'http://192.168.10.56:5000/api/upload/image',
        formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      Alert.alert('성공', '서버에 저장되었습니다!');
      console.log(data);
    } catch (error) {
      console.error(error);
      Alert.alert('실패', '서버 연결 상태를 확인하세요.');
    }
  };

  return (
    <View style={styles.container}>

      <Button title="사진 선택하기" onPress={pickImage} />

      {image && <Image source={{ uri: image.uri }} style={styles.image} />}0
      <Button title="서버로 전송" onPress={uploadImage} color="#007AFF" />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  image: { width: 300, height: 300, borderRadius: 10 },
});