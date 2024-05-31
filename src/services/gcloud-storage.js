const fs = require("fs");
const { Storage } = require("@google-cloud/storage");
const os = require("os");

const osType = os.platform().toLowerCase();
const getError = (error) => (error && error.message ? error.message : error);

class GutilFileUpload {
    constructor() {
        if (process.env.GCLOUD_BUCKET_NAME) {
            console.log("** GCLOUD STORAGE CONNECTION **");
            this.bucketName = process.env.GCLOUD_BUCKET_NAME || "";
            this.storageInstance = this.createConnection();
            this.getMetadataOfStorage();
            this.bucketInstance = this.storageInstance.bucket(this.bucketName);
        }
    }

    /**
 * To test gcloud storage connection, get metadata of storage bucket.
 */

    createConnection() {
        try {
            return new Storage();
        } catch (createConnectionError) {
            console.log(`Gcloud Storage Service > createConnection > ${getError(createConnectionError)}.`);
            return null;
        }
    }

    async getMetadataOfStorage() {
        try {
            // Get Bucket Metadata
            const metadata = await this.storageInstance.bucket(this.bucketName).getMetadata();
            const { name } = metadata[0];
            console.log("Gcloud Storage Service > metadata : ", name);
        } catch (metadataError) {
            console.log(`Gcloud Storage Service > getMetadataOfStorage > ${getError(metadataError)}.`);
        }
    }

    /**
     * This function allows you to check whether the file exists on the bucket.
     * @param {String} filePath - file path
     * @returns {Boolean} - return file exists or not on bucket
     */
    async isFileExists(filePath) {
        const isFileExist = await this.bucketInstance.file(this.formatPath(filePath)).exists();
        return isFileExist[0] || false;
    }

    /**
     * This function is used for reading the contents of the gcloud storage.
     * @param {String} filePath - file path.
     * @returns {String} - return file content in case of no error.
    */
    async readFileBuffer(filePath) {
        try {
            if (!filePath) throw new TypeError("File path is missing.");
            return this.bucketInstance.file(this.formatPath(filePath)).download().then((data) => data[0]);
        } catch (error) {
            console.log("Gcloud | readFileBuffer > ", getError(error));
        }
    }

    /**
     * This function is used to upload a single file without stream.
     * @param {String} filePath - File path
     * @param {String} content - File Buffer
    */
    async writeFile(filePath, content) {
        await this.bucketInstance.file(filePath).save(content).catch((error) => console.log(error.message));
    }

    /**
     * This function allows you to delete the file from the gcloud storage.
     * @param {String} filePath - File path
     * @return {Boolean}
    */
    async deleteFile(filePath) {
        const isFileExist = await this.isFileExists(filePath);
        if (!isFileExist) return false;
        const [, error] = await await this.bucketInstance.file(this.formatPath(filePath)).delete();
        if (error) {
            console.log("remove file error : ", getError(error));
            return false;
        }
        return true;
    }

    /**
     * This function allowes to upload a file on buckect thought he streams
     * @param {String} filePath - File path
     * @param {String} fileBuffer - File Buffer
     */
    async writeFileStream(filePath, fileBuffer) {
        return new Promise((resolve, reject) => {
            const fileInstance = this.bucketInstance.file(this.formatPath((filePath)));
            const fileStream = fileInstance.createWriteStream({ resumable: true, gzip: true });
            fileStream.on("finish", () => {
                resolve(true);
            }).on("error", (error) => {
                throw error;
            }).end(fileBuffer);
        });
    }

    /**
     * This function allowes you to delete a directory from the bucket
     * @param {String} dir - Path of Directory
     */
    async deleteDirectory(dir) {
        return this.bucketInstance.deleteFiles({ prefix: `${dir}` }, function (err) {
            if (err) {
                console.log(`Error on delete folder  ${dir} , error is - ${err}`);
            } else {
                console.log(`Successfully delete folder  ${dir}`);
            }
        });
    }

    /**
     * Format file path, replace '\' with '/'.
     * @param {string} pathText
     * @returns {String} - return formated path
     */
    formatPath(pathText) {
        return pathText && osType === "win32" ? pathText.replace(/\\/g, "/") : pathText;
    }

    /**
     * This function is used to download file direct to destination from gcloud storage.
     * @param {string} filePath - file path.
     * @param {string} destFileName - file name where download this file buffer.
     * @param {object} response - response object to stream file buffer in response.
     */
    async downloadFile(filePath, destFileName = null, response = null) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                if (!(filePath && (destFileName || response))) {
                    throw new TypeError("File path is missing.");
                }
                const isFileExist = await this.isFileExists(filePath);
                if (!isFileExist) throw new Error("file not found");

                const readFileStream = this.bucketInstance.file(this.formatPath(filePath)).createReadStream();
                if (destFileName) {
                    readFileStream.pipe(fs.createWriteStream(destFileName))
                        .on("finish", () => {
                            resolve(true);
                        }).on("error", (error) => {
                            fs.unlinkSync(destFileName);
                            throw error;
                        });
                } else if (response) {
                    readFileStream.pipe(response)
                        .on("finish", () => {
                            response.end();
                            resolve(true);
                        }).on("error", (error) => {
                            throw error;
                        });
                } else {
                    throw new TypeError("Destination file name missing.");
                }
            } catch (downloadFileError) {
                console.error(`gcloud storage service > downloadFile > ${getError(downloadFileError)}.`);
                reject(downloadFileError);
            }
        });
    }
}

module.exports = new GutilFileUpload();
