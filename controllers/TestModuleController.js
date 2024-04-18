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