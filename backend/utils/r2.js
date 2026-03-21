const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
require('dotenv').config();

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const uploadFile = async (fileName, fileBuffer, contentType) => {
    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
    });

    try {
        await r2Client.send(command);
        return {
            url: `${process.env.R2_PUBLIC_URL}/${fileName}`,
            path: fileName
        };
    } catch (err) {
        console.error("R2 Upload Error:", err);
        throw err;
    }
};

const deleteFile = async (fileName) => {
    const command = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
    });

    try {
        await r2Client.send(command);
    } catch (err) {
        console.error("R2 Delete Error:", err);
        throw err;
    }
};

const getFile = async (fileName) => {
    const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
    });

    try {
        const response = await r2Client.send(command);
        return response;
    } catch (err) {
        console.error("R2 Get Error:", err);
        throw err;
    }
};

const deleteFiles = async (fileNames) => {
    if (!fileNames || fileNames.length === 0) return;

    const command = new DeleteObjectsCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Delete: {
            Objects: fileNames.map(name => ({ Key: name })),
        },
    });

    try {
        await r2Client.send(command);
    } catch (err) {
        console.error("R2 Batch Delete Error:", err);
        throw err;
    }
};

module.exports = { uploadFile, getFile, deleteFile, deleteFiles };
