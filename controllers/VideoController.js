// controllers/video.controller.js
import mongoose from 'mongoose'

const { connection } = mongoose
let gfs

connection.once('open', function () {
	gfs = new mongoose.mongo.GridFSBucket(connection.db)
})

function uploadVideo(req, res) {
	if (!req.file) {
		return res.status(400).json({ message: 'No file uploaded' })
	}

	// Create a writable stream
	const writestream = gfs.openUploadStream(req.file.originalname)
	// Write file to GridFS
	writestream.write(req.file.buffer)

	writestream.end()

	writestream.on('finish', function () {
		return res.status(200).json({ message: 'File uploaded successfully' })
	})

	writestream.on('error', function (err) {
		return res.status(500).json({ error: err.message })
	})
}

function getVideo(req, res) {
	console.log(req.params.filename)
	if (!req.params.filename) {
		return res
			.status(400)
			.json({ message: 'Filename parameter is missing' })
	}
	const filename = req.params.filename

	// gfs.find({ filename: filename }).toArray((err, files) => {
	// 	console.log(files, err)

	// 	if (err) {
	// 		console.error('Error finding files:', err)
	// 		return res.status(500).json({ message: 'Internal Server Error' })
	// 	}

		// if (!files || files.length === 0) {
		// 	return res.status(404).json({ message: 'File not found' })
		// }

		const readstream = gfs.openDownloadStreamByName(filename)

		// const headers = {
		// 	'Accept-Ranges': 'bytes',
		// 	'Content-Type': 'video/mp4',
		// }

		// HTTP Status 206 for Partial Content
		// res.writeHead(206, headers)
		res.set('Content-Type', 'video/mp4');

		readstream.pipe(res)
	// })
}

export { uploadVideo, getVideo }
