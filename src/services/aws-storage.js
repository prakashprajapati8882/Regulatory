require("dotenv").config();
const AWS = require("aws-sdk");

const getError = (error) => (error && error.message ? error.message : error);

class AWSStorage {
    constructor() {
        this.bucketName = process.env.AWS_BUCKET_NAME;
        this.storageInstance = this.createConnection();
        this.s3BucketInstance = this.storageInstance[this.bucketName];
    }

    /**
     * This Function is use for creating the bucket instance
     */
    createConnection() {
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            signatureVersion: process.env.AWS_SIGNATURE_VERSION
        });
        AWS.config.region = process.env.AWS_REGION;
        return new AWS.S3();
    }

    /**
     * Format file path, replace '\' with '/'.
     * @param {string} pathText
     * @returns {String} - return formated path
     */
    formatPath(pathText) {
        return pathText.replace(/\\/g, "/");
    }

    /**
     * This function is used for reading the contents of the gcloud storage.
     * @param {String} filePath - file path.
     * @returns {String} - return file content in case of no error.
    */
    async readFileBuffer(filePath) {
        try {
            const formatedFilePath = this.formatPath(filePath);
            return new Promise((resolve, reject) => {
                const options = { Bucket: this.bucketName, key: formatedFilePath };
                const fileReadCallBack = function (err, data) {
                    if (err) {
                        console.log("AWS Storage | readFileBuffer > ", getError(err));
                        return resolve(false);
                    } else {
                        return resolve(data.Body);
                    }
                };
                this.s3BucketInstance.getObject(options, fileReadCallBack);
            });
        } catch (error) {
            console.log("AWS Storage | readFileBuffer > ERROR: ", getError(error));
        }
    }

    /**
     * This function is used to upload a single file without stream.
     * @param {String} filePath - File path
     * @param {String} fileBuffer - File Buffer data
     */
    async uploadFile(filePath, fileBuffer) {
        try {
            return new Promise((resolve, reject) => {

                const formatedFilePath = this.formatPath(filePath);
                const params = {
                    Bucket: this.bucketName,
                    Key: formatedFilePath,
                    Body: fileBuffer
                };
                this.s3BucketInstance.upload(params, async function (err, data) {
                    if (err) {
                        console.log("AWS Storage | uploadFile > ", getError(err));
                        reject(err);
                    }
                    console.log(`File uploaded successfully. ${data.Location}`);
                    resolve(true);
                });
            });
        } catch (error) {
            console.log("AWS Storage | uploadFile > ERROR: ", getError(error));
        }
    }

    /**
     * This function allows you to delete the file from the s3 storage
     * @param {String} filePath File Path 
     * @returns {Boolean} - File is deleted or not true/false
     */
    async deleteContent(filePath) {
        try {
            return new Promise((resolve, reject) => {
                const formatedFilePath = this.formatPath(filePath);
                const params1 = { Bucket: this.bucketName, Key: formatedFilePath };
                this.s3BucketInstance.deleteObject(params1, function (err, data) {
                    if (err) {
                        console.log("AWS Storage | deleteContent > ", getError(err));
                        return resolve(false);
                    } else {
                        return resolve(true);
                    }
                });
            });
        } catch (error) {
            console.log(`AWS Storage | deleteContent > ERROR: ${getError(error)}`);
            return false;
        }
    }
}

module.exports = new AWSStorage();