import express from "express";
// const multer = require("multer");
import multer from "multer";
// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// require("dotenv").config();
import dotenv from "dotenv";

dotenv.config();

const uploadRouter = express.Router();

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.AccessKey,
    secretAccessKey: process.env.SecretKey,
  },
  region: process.env.region,
});

// Multer config
const upload = multer({
  limits: 1024 * 1024 * 5,
  fileFilter: function (req, file, done) {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/webp" 
    ) {
      done(null, true);
    } else {
      done("Multer error - File type is not supported", false);
    }
  },
});

// Upload to S3 bucket
const uploadToS3 = async (fileData) => {
  const params = {
    Bucket: process.env.bucket,
    Key: `${Date.now().toString()}.jpg`,
    Body: fileData,
  };

  const command = new PutObjectCommand(params);

  try {
    const data = await client.send(command);
    const imageUrl = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
    return { data, imageUrl };
  } catch (error) {
    console.log(`error = ${error}`);
    throw error;
  }
};

uploadRouter.post("/", upload.single("image"), async (req, res) => {
  console.log(req.file);

  if (req.file) {
    try {
      const { imageUrl } = await uploadToS3(req.file.buffer);
      res.json({ imageUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload image to S3" });
    }
  } else {
    res.status(400).json({ error: "No image file provided" });
  }
});

export default uploadRouter;
