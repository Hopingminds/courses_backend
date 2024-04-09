import CollegesModel from '../model/CollegesData.model.js'

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