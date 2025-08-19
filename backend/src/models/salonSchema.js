import mongoose from "mongoose"

const salonDetails = new mongoose.Schema({
  owner:{type:mongoose.Schema.Types.ObjectId , ref:'User' , required:true},
  name:{type:String , required:true},
  services:[{
    name:String,
    price:Number,
    duration:Number
  }],
  address:{type:String , required:true},
  contact:{type:String , required:true},
  createdAt:{type:Date , default:Date.now}
})


const Salon = new mongoose.model('Salon' , salonDetails);

export default Salon;