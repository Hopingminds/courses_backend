import CareerModel from '../model/Career.model.js'
import HirefromusModel from '../model/Hirefromus.model.js';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
/** POST: https://localhost:8080/api/addcareerform
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

export async function updateRecruiter(req, res) {
	const body = req.body
	try {
		HirefromusModel.updateOne({ _id: body._id }, body)
			.exec()
			.then(()=>{
				return res
					.status(200)
					.json({ message: 'Updated Successfully!', success: true })
			})
			.catch((error)=>{
				return res
					.status(500)
					.json({ message: 'Internal server error', success: false, error })
			})
	} catch (error) {
		
	}
}

export async function loginRecWithEmail(req, res) {
	const { email, password } = req.body
	try {
		HirefromusModel.findOne({ email })
			.then((rec) => {
				bcrypt
					.compare(password, rec.password)
					.then((passwordCheck) => {
						if (!passwordCheck)
							return res
								.status(400)
								.send({ error: "Wrong password" })

						// create jwt token
						const token = jwt.sign(
							{
								recID: rec._id,
								email: rec.email,
								mobile: rec.mobile
							},
							process.env.JWT_SECRET,
							{ expiresIn: '24h' }
						)
						return res.status(200).send({
							msg: 'Login Successful',
							email: rec.email,
							token,
						})
					})
					.catch((error) => {
						return res
							.status(400)
							.send({ error: 'Password does not match' })
					})
			})
			.catch((error) => {

                console.log(error);
				return res.status(404).send({ error: 'Email not Found' })
			})
	} catch (error) {
		return res.status(500).send(error)
	}
}
