import axios from "axios";

const instance = axios.create({
  // 본인 컴퓨터의 IPv4 주소를 입력하세요
  baseURL: "http://192.168.10.56:5000/api",
  // baseURL: "http://192.168.45.200:5000/api",
  withCredentials: true,
  // timeout: 5000, // 5초 안에 응답이 없으면 연결 종료
  headers: {
    "Content-Type": "application/json",
  },
});

export default instance;
