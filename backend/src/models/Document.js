import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    creditRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "CreditRequest", required: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
