const Middleware = require("../classes/middleware"),
	  File       = require("../classes/file"),
	  multer     = require("multer"),
	  mkdirp     = require("mkdirp"),
	  path       = require("path"),
	  util       = require("../util"),
	  _          = require("lodash");

const DEFAULT_MAXIMUM_FILE_SIZE = 8 * 1024 * 1024; // 8 megabytes

module.exports = class FileUploadMiddleware extends Middleware {
	constructor(...args) {
		super(...args);

		//Ensure file uploading is enabled
		if(!this._app._expressOptions.upload) return;

		this._storageRoot = this._app._expressOptions.upload?.storageRoot;
		if(!_.isString(this._storageRoot)) {
			throw new Error("File upload middleware must be passed a storage root.");
		}

		//Create directories
		mkdirp.sync(path.join(this._storageRoot, "/processing"));

		//Create custom storage engine
		let storageEngine = multer.diskStorage({
			destination: path.join(this._storageRoot, "/temp"),
			filename(req, file, cb) {
				util.GenerateID()
					.then(id => cb(null, id))
					.catch(e => cb(e));
			}
		});

		//Create default settings
		let opts = {
			storage: storageEngine
		};

		//Set limit according to the maximumFileSize property, or the 8mb default
		let limit = this._app._expressOptions.upload.maximumFileSize ?? DEFAULT_MAXIMUM_FILE_SIZE;
		if(limit) {
			opts.limits = {
				fileSize: limit,
				fieldSize: limit
			};
		}

		//Merge the rest of the settings
		if(_.isPlainObject(this._app._expressOptions.upload)) {
			_.assign(opts, this._app._expressOptions.upload);
		}

		//Create the multer instane with these settings
		this._multer = multer(opts);
	}

	async run(req, res) {
		let names = req.handler._route._uploadFileNames;
		if(!names || !this._multer) return;

		let opts = [];
		for(let name of names) {
			opts.push({name, maxCount: 1});
		}

		let raw = this._multer.fields(opts);
		let wrapped = Middleware.promisifyExpressMiddleware(raw);
		await wrapped(req, res);

		//Ensure the files object is always present regardless of whether or not a file was actually uploaded
		req.files = req.files ?? Object.create(null);

		//Instantiate custom file class for each uploaded file
		for(let name in req.files) {
			let fileArr = req.files[name];
			if(!Array.isArray(fileArr) || fileArr.length < 1) continue;
			req.files[name] = new File(fileArr[0], this._storageRoot, this._app._container?.disk);
		}
	}
};