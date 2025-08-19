import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  customer:{type:mongoose.Schema.Types.ObjectId  , ref:'User', required:true},
  salon:{type:mongoose.Schema.Types.ObjectId , ref:'Salon' , required:true },
  service: {
    name: { type: String, required: true },  // e.g. Haircut
    price: { type: Number, required: true }  // price at booking time
  },
  startTime: { type: Date, required: true }, // exact start date+time of appointment
  endTime: { type: Date, required: true },
  createdAt:{type: Date , default : Date.now},
  status:{type:String  , enum:['pending' , 'completed' , 'cancelled'] , default:'pending' },
  queuePosition:{type:Number}


})


const Appointment = new mongoose.model('Appointment' , appointmentSchema);

export default Appointment;