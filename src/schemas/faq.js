const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true
    },
    answer: {
      type: String,
      required: false,
      maxlength: 5000
    },
    sorting: {
      type: Number,
      default: 0
    },
    status: {
      type: Boolean,
      default: true
    },
    type: {
      type: String,
      maxlength: 50,
      enum: ['general', 'technical', 'account'],
      default: 'general'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: false
    },
  },
  {
    timestamps: true
  }
);

// Add text index for search functionality
faqSchema.index({ question: 'text', answer: 'text' });

const FAQModel = mongoose.model('faqs', faqSchema);
module.exports = { FAQModel };