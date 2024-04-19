import TestModuleModel from "../model/Testmodule.model.js";
import UsertestreportModel from "../model/Usertestreport.model.js";

/** POST: http://localhost:8080/api/createtestmodule
* @param: {
    "header" : "Admin <token>"
}
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

/** GET: http://localhost:8080/api/getallmodules 
* @param: {
    "header" : "User/Admin <token>"
}
*/
export async function getAllModules(req, res) {
	function calculateProgress(module) {
		const submittedCount = module.generatedQustionSet.filter(question => question.isSubmitted).length;
		const totalQuestions = module.generatedQustionSet.length;
		return (submittedCount / totalQuestions) * 100;
	}

	try {
		const {userID} = req.user
		if (!userID) {
			return res.status(500).send({ error: 'User Not Found!' })
		}
		let Module = await TestModuleModel.find({ })
		let data  = Module.map((module)=>{
			const { questions, ...rest } = module.toObject()
			return rest
		})
		let UserModelProgress = await UsertestreportModel.find({ user: userID})
		UserModelProgress.forEach(module => {
			const progress = calculateProgress(module);
			for (let i = 0; i < data.length; i++) {
				const Module = data[i];
				if (Module._id.toString() === module.module.toString()) {
					console.log(data[i]['progress'] = progress)
				}
			}
		});

		return res.status(200).send({ success: true, data: data })
	} catch (error) {
		return res.status(500).send({ error: 'Internal Server Error', error })
	}
}

/** GET: http://localhost:8080/api/getallmodulesadmin 
* @param: {
    "header" : "User/Admin <token>"
}
*/
export async function getAllModulesAdmin(req, res) {
	try {
		let Module = await TestModuleModel.find({ })
		let data  = Module.map((module)=>{
			const { questions, ...rest } = module.toObject()
			return rest
		})
		return res.status(200).send({ success: true, data: data })
	} catch (error) {
		return res.status(500).send({ error: 'Internal Server Error', error })
	}
}