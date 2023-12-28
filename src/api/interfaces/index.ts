import { Document, Types } from "mongoose";

export interface ITicket extends Document {
  _id: Types.ObjectId;
  user?: Types.ObjectId;
  bookingDate: Date | null;
  status: "open" | "closed";
  price: number;
  seatNumber: number;
  bus?: Types.ObjectId;
}

export interface IBus extends Document {
  _id: Types.ObjectId;
  totalSeats: number;
  bookedSeats: number;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  isAdmin: boolean;
  phone: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
