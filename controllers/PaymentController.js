import { encrypt } from "../middleware/encryption.js";
import 'dotenv/config';

const { ICICI_MERCHANT_ID, ICICI_ENCRYPTION_KEY, RETURN_URL } = process.env;

export const initiatePayment = async (req, res) => {
    const { amount, customerDetails, referenceNo, submerchantId, transactionAmount, payMode } = req.body;

    try {
        // Validate input fields
        if (!referenceNo || !submerchantId || !transactionAmount || !payMode) {
            return res.status(400).send('Missing required fields');
        }

        // Encrypt individual fields
        const mandatoryFields = `123456|11|100|test@gmail.com|9087654321|test|xyz|X|Y|Z|500035`;
        // const encryptedMandatoryFields = encodeURIComponent(encrypt(mandatoryFields, ICICI_ENCRYPTION_KEY));

        // const encryptedReturnUrl = encodeURIComponent(encrypt(RETURN_URL, ICICI_ENCRYPTION_KEY));
        // const encryptedReferenceNo = encodeURIComponent(encrypt(referenceNo, ICICI_ENCRYPTION_KEY));
        // const encryptedSubmerchantId = encodeURIComponent(encrypt(submerchantId, ICICI_ENCRYPTION_KEY));
        // const encryptedTransactionAmount = encodeURIComponent(encrypt(transactionAmount, ICICI_ENCRYPTION_KEY));
        // const encryptedPayMode = encodeURIComponent(encrypt(payMode, ICICI_ENCRYPTION_KEY));
        
        const encryptedMandatoryFields = encrypt(mandatoryFields, ICICI_ENCRYPTION_KEY)

        const encryptedReturnUrl = encrypt(RETURN_URL, ICICI_ENCRYPTION_KEY)
        const encryptedReferenceNo = encrypt(referenceNo, ICICI_ENCRYPTION_KEY)
        const encryptedSubmerchantId = encrypt(submerchantId, ICICI_ENCRYPTION_KEY)
        const encryptedTransactionAmount = encrypt(transactionAmount, ICICI_ENCRYPTION_KEY)
        const encryptedPayMode = encrypt(payMode, ICICI_ENCRYPTION_KEY)

        // Form the URL
        const paymentUrl = `https://eazypayuat.icicibank.com/EazyPG?merchantid=${ICICI_MERCHANT_ID}&mandatoryfields=${encryptedMandatoryFields}&optionalfields=&returnurl=${encryptedReturnUrl}&ReferenceNo=${encryptedReferenceNo}&submerchantid=${encryptedSubmerchantId}&transactionamount=${encryptedTransactionAmount}&paymode=${encryptedPayMode}`;

        res.json({ paymentUrl });
    } catch (error) {
        console.error('Error initiating payment:', error);
        res.status(500).send('Internal Server Error');
    }
};
