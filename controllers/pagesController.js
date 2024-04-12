import CareerModel from '../model/Career.model.js'
import HirefromusModel from '../model/Hirefromus.model.js';

/** POST: https://localhost:8080/api/addcareerfrom
    body: {
        "name": ""
        "email": ""
        "phone": ""
        "degree": ""
    }
*/
export async function addCareerForm(req, res) {
    try {
        const body = req.body
        
        let career = new CareerModel(body)
        await career.save()
        
        return res.status(200).json({ success: true, message: 'Record Saved Successfully!'});
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error', error});
    }
}

/** POST: https://localhost:8080/api/addhirefromusform
    body: {
        "name": ""
        "email": ""
        "phone": ""
        "company": ""
    }
*/
export async function hideFromUsForm(req, res) {
    try {
        const body = req.body
        
        let hire = new HirefromusModel(body)
        await hire.save()
        
        return res.status(200).json({ success: true, message: 'Record Saved Successfully!'});
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error', error});
    }
}