const data = {
    keywords: {
        greeting: ["hello", "hi", "hey", "hai"],
        farewell: ["bye", "goodbye", "see you"],
        items: ["What is the pay-after-placement model?"],
        charges: [
            "How does the payment process work in the pay-after-placement model?",
        ],
        offers: [
            "What happens if I don't get a job after completing the training?",
        ],
        track: [
            "Are there any eligibility criteria to qualify for the pay-after-placement model?",
        ],
        history: [
            "What type of support can I expect during the job placement process?",
        ],
        product: [
            "Is there a limit to the salary from which my payments will be deducted?",
        ],
        question7: [
            "Can I opt out of the pay-after-placement agreement if I decide to not pursue a job in the field I trained for?",
        ],
        question8: [
            "How long after getting a job do I need to start making payments?",
        ],
        question9: [
            "What measures do you take to ensure the quality of education under this model?",
        ],
        question10: [
            "Who can I contact if I have more questions about the pay-after-placement model?",
        ],
        question11: [
            "What qualifications do I need to enroll in the pay-after-placement program?",
        ],
        question12: ["How are the payments calculated after I get a job?"],

        question13: [
            "What kinds of jobs can I expect to find after completing my training?",
        ],
        question14: ["Is there a fee if I decide to leave the program early?"],
        question15: [
            "How do you ensure placements after completion of the training?",
        ],
        question16: [
            "Are there any additional costs involved besides the repayment after placement?",
        ],
        question17: ["What if my salary decreases or I change jobs?"],
        question18: [
            "Do you offer support for international students in job placements?",
        ],
        question19: ["Can I pause my studies and resume them later?"],
        question20: [
            "What happens if I don’t find a job within the specified time after training?",
        ],
    },
    responses: {
        greeting: "Hello! How can I assist you today?",
        farewell: "Thank you! Have a great day!",
        items:
            "Our pay-after-placement model means you only pay for your training once you secure a job. This ensures that our goals are aligned with yours: we succeed when you succeed!",
        not_understood:
            "I am sorry, I did not understand that. Could you please ask again?",
        track:
            "Yes, there are certain eligibility criteria to qualify for this model, which may include academic qualifications, assessment scores, and the completion of preliminary courses. Please contact us or visit our website for detailed information.",
        charges:
            "After completing your training, you will only need to start paying once you find a job. Payments are typically structured as a percentage of your salary over a set period, ensuring they are affordable and proportional to your income.",
        offers:
            "If you do not secure employment within a specified period after completing your training, you won’t have to pay for the course. Our commitment is to help you succeed in your career.",
        product:
            "Yes, payments are only deducted from salaries that meet or exceed a certain threshold, ensuring that your payments are always manageable. Details of these thresholds are available in our terms and conditions.",
        history:
            "We offer comprehensive support including resume building, interview preparation, and access to our network of employers. Our aim is to equip you with the skills and support you need to successfully secure a job.",
        question7:
            "Opting out of the agreement is subject to terms and conditions specific to your course. We advise discussing your options with our support team to find the best solution for your situation.",
        question8:
            "Payment typically starts one month after you begin your new job, allowing you some time to settle into your role and manage your finances.",
        question9:
            "We maintain a high standard of education by employing expert instructors, using the latest technology and learning tools, and continuously updating our curriculum to align with industry demands. Our success depends on your success, so we invest heavily in quality education.",
        question10:
            "Please feel free to contact our support team at [support email/phone number] or visit our website for more detailed information. We're here to help you every step of the way!",
        question11:
            "Enrollment qualifications vary by program. Typically, they include a combination of educational background, skills assessments, and an interview process. Please check our specific program requirements on our website or contact us directly.",
        question12:
            "Payments are calculated as a percentage of your monthly income, ensuring they are affordable. The exact percentage and terms depend on the program and are detailed in your enrollment agreement.",
        question13:
            "Our programs are designed to prepare you for high-demand roles in your field of study. The specific types of jobs depend on the current market and the specific skills you’ve acquired during your training.",
        question14:
            "If you decide to leave the program early, specific terms regarding any fees or obligations will apply. We recommend reviewing your enrollment agreement for details or contacting our support team.",
        question15:
            "We have partnerships with leading companies and a dedicated placement team that works diligently to match you with suitable job opportunities based on your skills and preferences.",
        question16:
            "There are no additional tuition costs beyond your repayment plan. However, there may be minimal fees for materials or third-party resources required for some courses. All potential costs are clearly outlined before you enroll.",
        question17:
            "Should your financial situation change, we offer flexible repayment options. It’s important to communicate changes in your employment status to us so we can adjust your repayment plan accordingly.",
        question18:
            "Yes, we provide support for international students, including visa advice and job placement assistance, to ensure you can maximize your career opportunities.",
        question19:
            "We understand that life circumstances can change. You can pause your studies and resume them at a later date, depending on the specific program policies. Please contact us to discuss your situation.",
        question20:
            "If you do not secure a job within the specified time, your repayment obligations may be paused or waived, based on the terms of your agreement. We strive to support our graduates until they find employment.",
    },
};

async function findResponse(userInput, data) {
    if (!userInput) {
        console.error("No user input received");
        return data.responses.not_understood;
    }

    // Check if user input contains any keywords and respond accordingly
    for (const [keyword, synonyms] of Object.entries(data.keywords)) {
        if (
            synonyms.some((synonym) =>
                userInput.toLowerCase().includes(synonym.toLowerCase())
            )
        ) {
            return data.responses[keyword] || data.responses.not_understood;
        }
    }

    return data.responses.not_understood; // Return default response if no match found
}


export async function getBotResponse(req, res) {
    const userInput = req.body.user_input; // Ensure this matches the client's sent data key
    if (!userInput) {
        return res.status(400).json({ error: "No input provided" });
    }
    const response = await findResponse(userInput, data);
    res.json({ response: response });
}