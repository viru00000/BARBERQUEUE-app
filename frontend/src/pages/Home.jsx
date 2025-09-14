import React from 'react';
import RoleCard from '../components/RoleCard';
import { Link } from 'react-router-dom';
import { FaUserTie, FaCut } from 'react-icons/fa';


const Home = () => {
  return (
    <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-6 pt-24 px-4 min-h-screen">
      <Link to='/login'>
        <RoleCard
          title="I'm a Customer"
          description="Find nearby barbers and join their queue remotely"
          icon={FaUserTie}
          points={["Find barbers near you", "Save your precious Time", "Get on queue"]}
        />
      </Link>
      <Link to='/register'>
        <RoleCard
          title="I'm a Barber"
          description="Scale your Business online max out profits"
          icon={FaCut}
          points={["Real time update", "Remote queue", "Efficient queue management"]}
        />
      </Link>
    </div>
  );
}

export default Home;
