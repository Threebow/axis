const StorageDisk = require("../classes/storageDisk"),
	  {promisify} = require("util"),
	  mkdirp      = require("mkdirp"),
	  path        = require("path"),
	  fs          = require("fs");

const renameAsync = promisify(fs.rename);
const unlinkAsync = promisify(fs.unlink);

module.exports = class FilesystemStorageDisk extends StorageDisk {
	constructor(root) {
		super();
		this._root = root;

		mkdirp.sync(this._root);
	}

	store(filePath, stream) {
		return new Promise((resolve, reject) => {
			stream.pipe(fs.createWriteStream(this._resolveFilePath(filePath)))
				.on("error", reject)
				.on("finish", resolve);
		});
	}

	get(filePath) {
		return fs.createReadStream(this._resolveFilePath(filePath));
	}

	unlink(filePath) {
		return unlinkAsync(this._resolveFilePath(filePath));
	}

	rename(filePath, newFilePath) {
		return renameAsync(this._resolveFilePath(filePath), this._resolveFilePath(newFilePath));
	}

	mkdirp(dir) {
		return mkdirp(this._resolveFilePath(dir));
	}

	_resolveFilePath(relativePath) {
		return path.join(this._root, relativePath);
	}
};