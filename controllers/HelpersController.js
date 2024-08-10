import CollegesModel from '../model/CollegesData.model.js'
import GroupsModel from '../model/Groups.model.js';

export async function getColleges(req, res) {
    try {
        const {search} = req.query;
        console.log(search);
        const regex = new RegExp(search, "i");

        const colleges = await CollegesModel.find({ college: regex }).limit(10);
        
        res.json(colleges);
    } catch (err) {
        res.status(500).json({ message: err.message }); // If an error occurs, send a 500 status code along with the error message
    }
}

/** POST: http://localhost:8080/api/maketeacherchatavailable
body: {
    "groupId": "teacherchat",
}
*/
export async function makeTeacherChatAvailable(req, res) {
    try {
        const { groupId } = req.body;
        
        // Check if the group exists
        let group = await GroupsModel.findOne({ groupId });

        if (!group) {
            // Create the group if it does not exist
            group = new GroupsModel({
                groupId,
                isTeacherChatAvailable: true // Set the initial value as true
            });
        } else {
            // If the group exists, just update the isTeacherChatAvailable field
            if(group.isTeacherChatAvailable){
                group.isTeacherChatAvailable = false;
            }
            else{
                group.isTeacherChatAvailable = true;
            }
        }

        await group.save();

        res.json({ success: true, message: "Teacher chat is now available" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal server error', });
    }
}

/** GET: http://localhost:8080/api/isteacherchatavailable?groupId=teacherchat */
export async function isTeacherChatAvailable(req, res) {
    try {
        const { groupId } = req.query;
        const group = await GroupsModel.findOne({ groupId });

        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        if (!group.isTeacherChatAvailable) {
            return res.json({ success: false, message: "Teacher chat is not available" });
        }

        res.json({ success: true, message: "Teacher chat is available" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
}