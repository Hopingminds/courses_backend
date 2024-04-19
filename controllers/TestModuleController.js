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
	try {
		const { userID } = req.user;
		if (!userID) {
			return res.status(500).send({ error: 'User Not Found!' });
		}

		// Fetch all modules and user progress in parallel
		const [modules, userProgress] = await Promise.all([
			TestModuleModel.find({}),
			UsertestreportModel.find({ user: userID })
		]);

		// Create a map to store module progress for constant time lookup
		const progressMap = new Map();

		userProgress.forEach(module => {
			const progress = calculateProgress(module);
			progressMap.set(module.module.toString(), progress);
		});

		// Update progress for each module
		const data = modules.map(module => {
			const { questions, ...rest } = module.toObject();
			const progress = progressMap.get(module._id.toString()) || 0; // Default to 0 if progress not found
			return { ...rest, progress };
		});

		return res.status(200).send({ success: true, data });
	} catch (error) {
		return res.status(500).send({ error: 'Internal Server Error', error });
	}
}

function calculateProgress(module) {
	const submittedCount = module.generatedQustionSet.filter(question => question.isSubmitted).length;
	const totalQuestions = module.generatedQustionSet.length;
	return (submittedCount / totalQuestions) * 100;
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