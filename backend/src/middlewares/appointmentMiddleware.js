

export const validationAppointment = async(req , res ,next)=>{
  const {customer , salon ,  service , startTime , endTime , queuePosition} = req.body;
  if(!customer || !salon ||  !service || !startTime || !endTime || !queuePosition){
    return res.status(400).json({message : "missing feilds"})
  }
  next();
}