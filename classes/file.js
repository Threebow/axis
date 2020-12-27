const StorageDisk = require("./storageDisk"),
	  {promisify} = require("util"),
	  PngQuant    = require("pngquant"),
	  sharp       = require("sharp"),
	  mime        = require("mime-types"),
	  path        = require("path"),
	  fs          = require("fs"),
	  _           = require("lodash");

const renameAsync = promisify(fs.rename);
const unlinkAsync = promisify(fs.unlink);

module.exports = class File {
	constructor(data, storageRoot, defaultDisk) {
		this.originalName = data.originalname;
		this.baseName = data.filename;
		this.mimeType = data.mimetype;
		this.path = data.path;
		this.size = data.size;

		this._storageRoot = storageRoot;
		this._defaultDisk = defaultDisk;

		return new Proxy(this, {
			get: (target, prop, receiver) => {
				//Return the property in the file if it exists
				let res = Reflect.get(target, prop, receiver);
				if(!_.isUndefined(res)) return res;

				//Otherwise, proxy the sharp function
				let fn = sharp.prototype[prop];
				if(_.isFunction(fn)) {
					return (...args) => {
						fn.apply(target.sharp, args);
						return receiver;
					};
				}
			}
		});
	}

	compressedPng(quality = 80) {
		this._pngCompressionQuality = quality;
		this.sharp.png({force: true});
		return this;
	}

	saveTo(directory, storageDisk = this._defaultDisk) {
		return this.saveAs(path.join(directory, this.name), storageDisk);
	}

	async saveAs(fullPath, storageDisk) {
		if(!(storageDisk instanceof StorageDisk)) {
			throw new Error("A valid storage disk was not passed.");
		}

		let currentPath = await this._process();
		await storageDisk.store(fullPath, fs.createReadStream(currentPath));
		await unlinkAsync(currentPath);
	}

	async _process() {
		if(!this._sharp) {
			return this.path;
		}

		try {
			this._processingPath = path.join(this._storageRoot, "/processing", this.name);
			await this._sharp.toFile(this._processingPath);

			if(_.isNumber(this._pngCompressionQuality)) {
				await this._compressPng();
			}

			return this._processingPath;
		} finally {
			await unlinkAsync(this.path);
		}
	}

	_compressPng() {
		let tempPath = path.join(this._storageRoot, "/processing/", "COMPRESSING_" + this.name);

		return new Promise((resolve, reject) => {
			fs.createReadStream(this._processingPath)
				.on("error", reject)
				.pipe(new PngQuant([this._pngCompressionQuality]))
				.on("error", reject)
				.pipe(fs.createWriteStream(tempPath))
				.on("error", reject)
				.on("finish", () => {
					renameAsync(tempPath, this._processingPath)
						.then(resolve)
						.catch(reject);
				});
		});
	}

	get name() {
		return this.baseName + "." + this.extension;
	}

	get extension() {
		//Fix for zip files
		if(this.mimeType === "application/x-zip-compressed") return "zip";

		//Grab directly from sharp instance if present
		let format = this._sharp?.options?.formatOut;
		if(_.isString(format) && format !== "input") return format;

		//Return from the mime type database
		let ext = mime.extension(this.mimeType);
		if(ext === false) throw new Error(`Invalid extension for mime type ${this.mimeType}!`);

		return ext;
	}

	get sharp() {
		return this._sharp ?? (this._sharp = sharp(this.path));
	}
};