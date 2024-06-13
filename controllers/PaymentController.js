const axios = require('axios');
const encrypt = require('../utils/encryption');
require('dotenv').config();

const { ICICI_MERCHANT_ID, ICICI_ENCRYPTION_KEY, RETURN_URL } = process.env;

const initiatePayment = async (req, res) => {
    const { amount, customerDetails } = req.body;

    const payload = {
        merchant_id: ICICI_MERCHANT_ID,
        amount,
        return_url: RETURN_URL,
        customerDetails
    };

    const encryptedPayload = encrypt(JSON.stringify(payload), ICICI_ENCRYPTION_KEY);
    const paymentUrl = `https://eazypay.icicibank.com/EazyPG?encdata=${encryptedPayload}`;

    try {
        res.json({ paymentUrl });
    } catch (error) {
        console.error('Error initiating payment:', error);
        res.status(500).send('Internal Server Error');
    }
};

const handlePaymentResponse = (req, res) => {
    const { status, ezpaytranid, amount, pgreferenceno } = req.query;

    if (status === 'Success') {
        // Update your database with the successful transaction details
        // Redirect or respond to the client
        res.send('Payment successful');
    } else {
        // Handle failure cases
        res.send('Payment failed or pending');
    }
};

module.exports = {
    initiatePayment,
    handlePaymentResponse
};
