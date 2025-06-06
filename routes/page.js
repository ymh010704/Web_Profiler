const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const analyzeFile = require('../analyzeFile'); // 👈 불러오기

// GET /
router.get('/', (req, res) => {
  res.render('index');
});

// POST /upload
router.post('/upload', (req, res) => {
  const file = req.files?.inputFile;

  if (!file) return res.status(400).send("파일이 업로드되지 않았습니다.");

  const uploadPath = path.join(__dirname, '..', 'uploads', file.name);
  file.mv(uploadPath, async (err) => {
    if (err) return res.status(500).send("파일 저장 실패: " + err.message);

    try {
      const result = await analyzeFile(uploadPath);
      res.status(200).json(result);  // JSON으로 응답
    } catch (error) {
      res.status(500).send("분석 실패: " + error.message);
    }
  });
});

module.exports = router;
