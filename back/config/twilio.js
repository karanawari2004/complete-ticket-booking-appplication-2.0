
const twilio = require("twilio");

const sendOTP = async (phone, otp) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();
  const messagingServiceSid =
    process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

  if (
    !accountSid ||
    !authToken ||
    (!from && !messagingServiceSid)
  ) {
    throw new Error(
      "Set Twilio account credentials and either TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID"
    );
  }

  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({
      body: `Your On-Ground Sales OTP is ${otp}. Do not share this OTP with anyone.`,
      to: phone,
      ...(messagingServiceSid
        ? { messagingServiceSid }
        : { from }),
    });

    console.info("Twilio accepted OTP SMS", {
      sid: message.sid,
      status: message.status,
      to: phone,
    });

    return message;
  } catch (error) {
    console.error("TWILIO ERROR:", {
      code: error.code,
      message: error.message,
      status: error.status,
      moreInfo: error.moreInfo,
    });

    throw error;
  }
};

module.exports = sendOTP;
