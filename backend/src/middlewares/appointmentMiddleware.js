

export const validationAppointment = async(req , res ,next)=>{
  const {customer  , barber , service , startTime , endTime , queuePosition} = req.body;
  if(!customer || !barber || !service || !startTime || !endTime || !queuePosition){
    return res.status(400).json({message : "missing feilds"})
  }
  next();
}