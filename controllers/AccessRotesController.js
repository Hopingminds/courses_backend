import AccessRoutesModel from "../model/AccessRoutes.model.js";

/** POST: http://localhost:8080/api/addaccessroutes 
* @body : {
    "role" : "Admin",
    "routes": [{'dashboard'}, {'dashboard'}, ],
}
*/
export async function createAccessRoute(req, res) {
    try {
		const { role, routes } = req.body;

		// Check if the role already exists
        const existingRoute = await AccessRoutesModel.findOne({ role });
        if (existingRoute) {
            return res.status(400).json({ message: "Role already exists" });
        }

        // Ensure the routes array contains only unique routes
        const uniqueRoutes = [...new Set(routes)];

        // Create a new route
        const newRoute = new AccessRoutesModel({ role, routes: uniqueRoutes });
        await newRoute.save();

        res.status(201).json(newRoute);

	} catch (error) {
		return res.status(501).send({ success: false, msg:'Internal Server Error', error })
	}
}
console.log("check server")
/** GET: http://localhost:8080/api/getaccessroute/:role */
export async function getAccessRoute(req, res){
	try {
		const { role } = req.params;

        const routeData = await AccessRoutesModel.findOne({ role });

        if (!routeData) {
            return res.status(404).json({ success: false, msg: `Routes for ${role} not found` });
        }

        res.status(200).json({ success: true, data: routeData });
	} catch (error) {
		return res.status(501).send({ success: false, msg:'Internal Server Error', error })
	}
}

/** PUT: http://localhost:8080/api/updateaccess 
body: { 
    "role": "Admin",
	"routes": ["dash"]
}
*/
export async function updateAccessRoute(req, res) {
    try {
        const { routes, role } = req.body;

        // Check if accessibles is an array
        if (!Array.isArray(routes)) {
            return res.status(400).json({ success: false, msg: 'Routes must be an array of strings' });
        }

        // Find the route by role and update the routes field
        const updatedRoute = await AccessRoutesModel.findOneAndUpdate(
            { role },
            { $set: { routes } },
            { new: true, runValidators: true } // Return the updated document and run validation
        );

        if (!updatedRoute) {
            return res.status(404).json({ success: false, msg: `Routes for ${role} not found` });
        }

        res.status(200).json({ success: true, data: updatedRoute });

    } catch (error) {
        return res.status(501).send({ success: false, msg:'Internal Server Error', error })
    }
}

/** GET: http://localhost:8080/api/verifyadminuser/:route */
export async function verifyAdminUserAccess(req, res) {
    try {
        const { role } = req.admin;
        const { route } = req.params;

        // Check if the role exists
        const existingRoute = await AccessRoutesModel.findOne({ role });
        if (!existingRoute) {
            return res.status(404).json({ success: false, msg: `Role ${role} not found` });
        }

        // Check if the route exists in the routes array
        const hasAccess = existingRoute.routes.includes(route);
        if (!hasAccess) {
            return res.status(403).json({ success: false, msg: `Access to route ${route} denied for role ${role}` });
        }

        res.status(200).json({ success: true, msg: `Access to route ${route} granted for role ${role}` });

    } catch (error) {
        return res.status(501).send({ success: false, msg:'Internal Server Error', error })
    }
}
