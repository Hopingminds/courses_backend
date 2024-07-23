import PromoModel from "../model/Promo.model.js";
import UserModel from "../model/User.model.js";

/** POST: http://localhost:8080/api/createpromocode 
* @body : {
	"promocode": "HM001"
	"validTill" : "Date",
    "discountPercentage": "10",
    "quantity" : 100,
	"forCollege": "IKGPTU"
}
*/
export async function createPromo(req, res){
    try {
        const { promocode, validTill, discountPercentage, quantity, forCollege } = req.body;

        const newPromo = new PromoModel({
            promocode,
            validTill: new Date(validTill),
            discountPercentage,
            quantity,
            forCollege
        });

        await newPromo.save();

        return res.status(201).json({ success: true, promocode: newPromo });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

/** PUT: http://localhost:8080/api/updatepromocode 
* @body : {
	"promocode": "HM001"
	"validTill" : "Date",
    "discountPercentage": "10",
    "quantity" : 100,
	"forCollege": "IKGPTU"
}
*/
export async function updatePromo(req, res){
    try {
        const { promocode, validTill, discountPercentage, quantity, forCollege } = req.body;

        // Create an object to hold the fields that need to be updated
        const updateFields = {};
        if (validTill !== undefined) updateFields.validTill = validTill;
        if (discountPercentage !== undefined) updateFields.discountPercentage = discountPercentage;
        if (quantity !== undefined) updateFields.quantity = quantity;
        if (forCollege !== undefined) updateFields.forCollege = forCollege;

        const promo = await PromoModel.findOneAndUpdate(
            { promocode },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!promo) {
            return res.status(404).json({ message: 'Promo Code not found' });
        }

        return res.status(201).json({ success: true, promocode: promo, message: 'Promo Code Updated' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

/** DELETE: http://localhost:8080/api/deletepromocode 
* @body : {
	"promocode": "HM001"
}
*/
export async function deletePromo(req, res){
    try {
        const { promocode } = req.body;

        const promo = await PromoModel.findOneAndDelete({ promocode });

        if (!promo) {
            return res.status(404).json({ message: 'Promo not found' });
        }

        return res.status(200).json({ success: true, message: 'Promo deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}

/** GET: http://localhost:8080/api/getallpromocode */
export async function getAllPromos(req, res) {
    try {
        const promos = await PromoModel.find();
        return res.status(200).json({ success: true, promocodes: promos });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
};

/** GET: http://localhost:8080/api/ispromocodevalid/:promoCode */
export async function isPromoValid(req, res){
    try {
        const { userID } = req.user;
		const { promoCode } = req.params;

		// Fetch user details
		const user = await UserModel.findById(userID);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		// Fetch promo code details
		const promo = await PromoModel.findOne({ promocode: promoCode });
		if (!promo) {
			return res.status(404).json({ message: 'Promo code not found' });
		}

		// Validate promo code
		const currentDate = new Date();
		if (promo.validTill < currentDate) {
			return res.status(400).json({ message: 'Promo code has expired' });
		}

		if (promo.forCollege && promo.forCollege !== user.college) {
			return res.status(400).json({ message: 'Promo code not valid for your college' });
		}

		if (promo.quantity <= 0) {
			return res.status(400).json({ message: 'Promo code quantity exceeded' });
		}

		// If all validations pass
		return res.status(200).json({ success: true, message: 'Promo code is valid' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error' + error.message });
    }
}