import TestModuleModel from "../model/TestModule.model.js";

/** POST: http://localhost:8080/api/createtestmodule
body: {
    "module_name": "React Js"
}
*/
export async function createTestModule(req, res) {
	try {
		const { module_name} = req.body

		const existingModule_name = await TestModuleModel.findOne({
			module_name
		})

		if (existingModule_name) {
			return res
				.status(400)
				.json({ error: 'Module with this name already exists' })
		}

		const newTestModule = new TestModuleModel({
			module_name
		})

		await newTestModule.save()

		return res.status(201).json({
			message: 'Test Module added successfully',
			category: newTestModule.module_name,
		})
	} catch (error) {
		return res.status(500).json({ error: 'Internal server error' })
	}
}

// GET: http://localhost:8080/api/getallmodules
export async function getAllModules(req, res) {
	try {
		TestModuleModel.find({ })
			.exec()
			.then((Module) => {
				let data  = Module.map((module)=>{
					const { questions, ...rest } = module.toObject()
					return rest
				})
				return res.status(200).send({ success: true, data: data })
			})
			.catch((err) => {
				return res.status(404).send({ error: 'Cannot Find Modules Data', err })
			})
	} catch (error) {
		return res.status(500).send({ error: 'Internal Server Error', error })
	}
}