// Barber.jsx (UI only)
import React, { useState } from "react";

const Barber = () => {
  const [customer , setCustomer] = useState([
  {
    id: 1,
    name: "Virendra Patil",
    phone: "9876543210",
    service: "Haircut",
    timeBooked: "10:30 AM",
    isNotified: false
  },
  {
    id: 2,
    name: "Gaurav Sharma",
    phone: "9123456780",
    service: "Shave",
    timeBooked: "10:45 AM",
    isNotified: false
  },
  {
    id: 3,
    name: "Kamlesh Yadav",
    phone: "9988776655",
    service: "Haircut & Beard",
    timeBooked: "11:00 AM",
    isNotified: false
  }
]);

  const [newCustomer , setNewCustomer] = useState({ name: "", phone: "", service: "", timeBooked: "" } );

  const [showForm , setShowForm] = useState(false)

  const addCustomer = ()=>{

    if( newCustomer.name && newCustomer.service && newCustomer.phone &&  newCustomer.timeBooked){
      setCustomer([...customer  , { ...newCustomer , id:Date.now() , isNotified:false }])
      setNewCustomer({ name: "", phone: "", service: "", timeBooked: "" });
      return true;
    }else{
      alert("fill all feilds to add customer");
      return false;
    }

  };

  const handleNext = ()=>{
    if(customer.length > 0){
      setCustomer(customer.slice(1));
    }
  }

  const clearCustomer = ()=>{
    setCustomer([]);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-cyan-400">Barber Dashboard</h1>

      <div className="mt-6">
        <h2 className="text-xl mb-3">Customer Queue</h2>

      {customer.length > 0  ? (
        <ul className="space-y-2">

          {customer.map((customer , index)=>(
            <li
               key={customer.id}
               className="bg-gray-800 p-3 rounded-lg flex justify-between" >
                <div>
                  {index + 1}. {customer.name} - {customer.service} ({customer.timeBooked}) - {customer.phone}
                </div>
            </li>
          ))}
      </ul>
      )
       :
      (
             <p className='text-grey-400'>No customers in queue</p>
      )}
 <div className="mt-3 flex gap-4">
         <button
            onClick={handleNext}
            className="bg-green-600 hover:bg-green-500 px-4 py-2  rounded-lg"
          >
            Serve Next
          </button>

          <button
            onClick={clearCustomer}
            className="bg-red-600 hover:bg-blue-500 px-4 py-2 rounded-lg"
          >
            Clear Queue
          </button>

          <button onClick={()=>setShowForm(!showForm)} className="bg-blue-600 hover:bg-red-500 px-4 py-2 rounded-lg">Add manually</button>
          </div>

          {showForm && (
            <form className="bg-gray-800 p-4 rounded-lg flex flex-col gap-2 w-full max-w-md mt-4 mb-4">
      <input
        type="text"
        value={newCustomer.name}
        onChange={(e)=>setNewCustomer({...newCustomer, name: e.target.value})}
        placeholder="Customer Name"
        className="p-2 rounded-md bg-gray-900 border border-gray-700 text-white"
      />
      <input
        type="text"
        value={newCustomer.phone}
        onChange={(e)=>setNewCustomer({...newCustomer , phone : e.target.value})}
        placeholder="Phone Number"
        className="p-2 rounded-md bg-gray-900 border border-gray-700 text-white"
      />
      <input
        type="text"
        value={newCustomer.service}
        onChange={(e)=>setNewCustomer({...newCustomer , service : e.target.value})}
        placeholder="Service"
        className="p-2 rounded-md bg-gray-900 border border-gray-700 text-white"
      />
      <input
        type="text"
        value={newCustomer.timeBooked}
        onChange={(e)=>setNewCustomer({...newCustomer , timeBooked :  e.target.value})}
        placeholder="Time Booked"
        className="p-2 rounded-md bg-gray-900 border border-gray-700 text-white"
      />
      <button
        type="button"
        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg mt-2"
        onClick={()=>{if (addCustomer() ) {  setShowForm(!showForm) }}}
      >
        Add Customer
      </button>
    </form>
          )}

      </div>
    </div>
  );
};

export default Barber;
