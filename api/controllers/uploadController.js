const uuidv4 = require('uuid/v4');
const fs = require('fs');
const jsonfile = require('jsonfile')
const filePath = 'data/product.json';
var path = require('path');



exports.test = function (request, response) {
    response.json("Challenger Uploader API");
};

exports.add_new_version = function (request, response) {
    try {
        process_post_request(request, response, add_product);
    } catch (error) {
        console.log("add_new_version Error : " + error);
        response.json("Error Occured");
    }
};

exports.get_latest_version = function (request, response) {
    try {

        process_get_request(request, response, fetch_latest_version);
    } catch (error) {
        console.log("add_new_version Error : " + error);
        response.json("Error Occured");
    }
};

exports.check_for_updates = async (request, response) => {
    try {

        var result = await check_updates();
        console.log(result);
        response.json({
            IsSuccessful: result.success,
            Result: {
                LatestVersion: result.data.version,
                FileName: result.data.filename,
                ProductVersionId: result.data.id,
                FileSize: await get_file_size(result.data.filename),
                ProductID: uuidv4(),
                ProductName: "Challenger"
            },
            Message: result.message
        });
    } catch (error) {
        console.log("add_new_version Error : " + error);
        response.json({
            IsSuccessful: false,
            Message: "Error Occured"
        });
    }
};


exports.fetch_latest_setup = async (request, response) => {
    try {
        var result = await fetch_latest_setup_file();
        console.log(result);
        if (result.success) {
            var appRoot = path.resolve(__dirname);
            var filepath = console.log(path.join(appRoot, "../../" + result.message));
            response.download(path.join(appRoot, "../../" + result.message));
        } else {
            response.json(result);
        }
    } catch (error) {
        console.log("add_new_version Error : " + error);
        response.json("Error Occured");
    }
};


process_post_request = async (request, response, callback) => {
    try {
        if (typeof callback !== 'function') return null;
        if (request.method == 'POST') {
            if (request.body.length > 1e6) {
                response.writeHead(413, 'Request Entity Too Large', {
                    'Content-Type': 'application/json'
                });
                response.json("Entity too large");
                request.connection.destroy();
            }
            try {
                var result = await callback(request);
                response.json(result);
            } catch (err) {
                response.json({
                    success: false,
                    message: "Error occured " + err
                });
            }

        } else {
            response.json("Method Not Supported");
        }
    } catch (error) {
        console.log("process_post_request Error : " + error);
        response.json("Error Occured");
    }
}

process_get_request = async (request, response, callback) => {
    try {
        if (typeof callback !== 'function') return null;
        if (request.method == 'GET') {
            try {
                var result = await callback(request.body);
                response.json(result);
            } catch (err) {
                response.json({
                    success: false,
                    message: "Error occured " + err
                });
            }

        } else {
            response.json({
                success: false,
                message: "Method Not Supported"
            });
        }
    } catch (error) {
        console.log("process_post_request Error : " + error);
        response.json({
            success: false,
            message: "Error occured"
        });
    }
}

fetch_latest_version = async (data) => {
    return new Promise(async (resolve) => {
        try {

            let existingFile = file_exists().then(async () => {
                let content = await read_file();
                var max_version = 0.0;
                for (let i = 0; i < content.products.length; i++) {
                    if (content.products[i].version > max_version) {
                        max_version = content.products[i].version;
                    }
                }
                resolve({
                    success: true,
                    version: max_version
                });
            })
        } catch (error) {
            console.log('Error occured  \n' + error);
            resolve({
                success: false,
                message: "Error occured"
            });
        }
    });
};

check_updates = async () => {
    return new Promise(async (resolve) => {
        try {

            let existingFile = file_exists().then(async () => {
                let content = await read_file();
                var max_version = 0.0;
                var item = 0;
                for (let i = 0; i < content.products.length; i++) {
                    if (content.products[i].version > max_version) {
                        max_version = content.products[i].version;
                        var item = i;
                    }
                }
                resolve({
                    success: true,
                    data: content.products[item],
                    message: "Success"
                });
            })
        } catch (error) {
            console.log('Error occured  \n' + error);
            resolve({
                success: false,
                message: "Error occured"
            });
        }
    });
};

fetch_latest_setup_file = async (data) => {
    return new Promise(async (resolve) => {
        try {
            let existingFile = file_exists().then(async () => {
                let content = await read_file();
                var max_version = 0.0;
                var filename = '';
                for (let i = 0; i < content.products.length; i++) {
                    if (content.products[i].version > max_version) {
                        max_version = content.products[i].version;
                        filename = content.products[i].filename;
                    }
                }
                resolve({
                    success: true,
                    message: "uploads/" + filename
                });
            })
        } catch (error) {
            console.log('Error occured  \n' + error);
            resolve({
                success: false,
                message: "Error occured"
            });
        }
    });
};



add_product = async (data) => {
    return new Promise(async (resolve) => {
        try {
            let uploadedSetup = data.files.uploadedFile;
            let version = data.body.version;
            var regexp = /^\d+(\.\d{1,2})?$/;
            if (!data || !version || !regexp.test(version) || version < 1) {
                resolve({
                    success: false,
                    message: "Invalid version"
                });
                return;
            }
            let existingFile = file_exists().then(async () => {
                let content = await read_file();
                for (let i = 0; i < content.products.length; i++) {
                    if (content.products[i].version >= data.version) {
                        resolve({
                            success: false,
                            message: "Version must be greater than latest version"
                        });
                        return;
                    }
                }
                let filename = uuidv4() + ".msi";
                var saveResult = await save_file(uploadedSetup, filename);
                if (saveResult != "saved") {
                    resolve({
                        success: false,
                        message: "Error occured"
                    });
                    return;
                }
                let obj = {
                    id: uuidv4(),
                    version: version,
                    filename: filename,
                    releaseDate: new Date()
                };
                content.products.push(obj);
                fs.writeFile(filePath, JSON.stringify(content), function (err) {
                    resolve({
                        success: true,
                        message: "New version uploaded"
                    });
                });
            })
        } catch (error) {
            console.log('Error occured  \n' + error);
            resolve({
                success: false,
                message: "Error occured"
            });
        }
    });
};

file_exists = () => {
    return new Promise(async (resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            var data = {
                "products": []
            };
            fs.writeFile(filePath, JSON.stringify(data), function (err) {
                if (err) {
                    console.log("Error : " + err);
                    reject();
                } else {
                    console.log("Product file created");
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
};

read_file = () => {
    return new Promise(async (resolve, reject) => {
        fs.readFile(filePath, function (err, obj) {
            let content = JSON.parse(obj);
            resolve(content);
        });
    });
};

save_file = (uploadedSetup, filename) => {
    return new Promise(async (resolve, reject) => {
        uploadedSetup.mv('uploads/' + filename, function (err) {
            console.log("Uploading setup");
            resolve("saved");
        });
    });
};

get_file_size = async (filename) => {
    return new Promise(async (resolve, reject) => {
        let stats = fs.statSync("uploads/" + filename);
        resolve(stats.size);
    });
};