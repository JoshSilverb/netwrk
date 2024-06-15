import React from 'react';
import ProfileCard from '@/components/ProfileCard';


const FeaturedProfiles = ({ profiles }) => {
  return (
    <div className=" rounded-xl bg-gray-50 p-4 border border-gray-300 overflow-y-auto ">
        {profiles.map((profile, key) => (
          <ProfileCard contact={profile} key={key} />
        ))}
        <div className="flex flex-row items-center justify-between py-4 focus:ring-blue-500 focus:border-blue-500 block text-base font-medium text-gray-900 dark:text-white border-t-2">
          <a href='/dashboard/contacts'>See all</a>
        </div>
    </div>
  );
};

export default FeaturedProfiles;