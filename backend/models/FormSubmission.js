const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    formTitle: {
      type: String,
      default: 'Scanned Form Document',
      trim: true,
    },
    fields: {
      type: Map,
      of: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['valid', 'submitted'],
      default: 'submitted',
    },
  },
  {
    timestamps: true,
    collection: 'form_submissions',
  }
);

module.exports =
  mongoose.models.FormSubmission ||
  mongoose.model('FormSubmission', formSubmissionSchema);
