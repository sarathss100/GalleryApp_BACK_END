import { Schema, Document, model, Types } from "mongoose";

interface IImage extends Document {
    userId: Types.ObjectId;
    title: string;
    imagePath: string;
    uploadedAt: Date;
    order: number;
    _id: Types.ObjectId;
}

const imageSchema = new Schema<IImage>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    imagePath: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

imageSchema.index({ userId: 1, order: 1 });

const Image = model<IImage>("Image", imageSchema);

export { 
    Image, 
    IImage 
};