import mongoose from 'mongoose';
import 'dotenv/config';
import Faq from '../models/Faq.js';

const defaultFaqs = [
  {
    question: "What are your shipping options and delivery times?",
    answer: "We offer delivery within Kathmandu Valley within 1-2 business days. For areas outside the valley, delivery typically takes 3-5 business days. We provide free shipping on orders above रू 2,000.",
    order: 0,
  },
  {
    question: "What is your return and exchange policy?",
    answer: "We accept returns and exchanges within 7 days of delivery for unworn items with original tags attached. The item must be in its original condition. Custom-tailored pieces are not eligible for returns or exchanges.",
    order: 1,
  },
  {
    question: "How do I care for my Diera clothing?",
    answer: "For best results, we recommend hand washing in cold water or dry cleaning for delicate items. Hang dry in shade to preserve colors. Iron on low heat if needed. Avoid harsh detergents and bleach.",
    order: 2,
  },
  {
    question: "Do you offer custom tailoring services?",
    answer: "Yes! We offer custom tailoring for sarees, kurtis, and other traditional wear. Visit our store or contact us via chat to discuss your requirements. Custom orders typically take 7-10 days to complete.",
    order: 3,
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept cash on delivery (COD), eSewa, and Khalti for online orders. For in-store purchases, we also accept cash and digital payments.",
    order: 4,
  },
  {
    question: "How can I track my order?",
    answer: "Once your order is shipped, you'll receive a notification. You can track your order status anytime by logging into your account and visiting the Orders section.",
    order: 5,
  },
];

async function seedFaqs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing FAQs
    await Faq.deleteMany({});
    console.log('Cleared existing FAQs');

    // Insert default FAQs
    await Faq.insertMany(defaultFaqs);
    console.log('Seeded default FAQs successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding FAQs:', error);
    process.exit(1);
  }
}

seedFaqs();
