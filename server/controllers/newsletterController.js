// server/controllers/newsletterController.js
const NewsletterSubscriber = require("../models/NewsletterSubscriber");
const { sendEmail } = require("../utils/mailer");

exports.subscribeNewsletter = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // check if exists
    let subscriber = await NewsletterSubscriber.findOne({ email });

    if (!subscriber) {
      subscriber = await NewsletterSubscriber.create({ email });

      // send welcome email (simple for now – we can design a fancy one later)
      await sendEmail({
        to: email,
        subject: "Welcome to Scentiva Newsletter ✨",
        html: `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height:1.6;">
            <h2 style="color:#8B5E3C; margin-bottom:8px;">Welcome to Scentiva 🕯️</h2>
            <p>Thanks for subscribing to our newsletter.</p>
            <p>You'll receive exclusive offers, new scent drops and gifting ideas straight to your inbox.</p>
            <p style="margin-top:16px;">Love & Light,<br/>Scentiva Team</p>
          </div>
        `,
      });
    }

    return res.json({ message: "Subscribed successfully!" });
  } catch (err) {
    console.error("Newsletter subscribe error:", err);
    return res.status(500).json({ message: "Error subscribing to newsletter" });
  }
};
// server/controllers/newsletterController.js
exports.getSubscribers = async (req, res) => {
  try {
    const subs = await NewsletterSubscriber.find().sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) {
    console.error("Get subscribers error:", err);
    res.status(500).json({ message: "Failed to fetch subscribers" });
  }
};

exports.deleteSubscriber = async (req,res)=>{
  const {id} = req.params;
  try {
    const sub = await NewsletterSubscriber.findByIdAndDelete(id);
    if(!sub){
      return res.status(404).json({message:'Subscriber not found'})
    }
    return res.json({message:'Subscriber Deleted'})
    
  } catch (err) {
    console.error('delete subscriber error',err)
    return res.status(500).json({message:"failed to delete scubscriber"})
    
  }
}

