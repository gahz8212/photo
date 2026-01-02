const express = require("express");
const multer = require("multer");
const cors = require("cors");
// const path = require("path");
const fs = require("fs");
const app = express();
app.use(cors());

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    // file.originalname = Buffer.from(file.originalname, "latin1").toString(
    //   "utf8"
    // );
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage: storage });
//실제로는  single대신에 array로 변경예정, sharp로 이미지 압축예정
// router.post("/images", upload.array("images"), async (req, res) => {
// try {
//   req.files.map((file) => {
//     sharp(file.path);
//   });
// } catch (e) {}
// });
app.post("/upload", upload.single("image"), (req, res) => {
  console.log("파일 수신 완료:", req.file.filename);
  res.json({ message: "서버 저장 성공!", fileName: req.file.fieldname });
});
app.listen(3000, () => console.log("서버 실행 중:http://localhost:3000"));
