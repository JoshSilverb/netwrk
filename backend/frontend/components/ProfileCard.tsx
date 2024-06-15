import React from "react";
import clsx from 'clsx';
import { Contact } from '@/constants/Definitions';

const ProfileCard = ({ contact, keyNum } : { contact : Contact, keyNum : number}) => {
    return (
        <div
            key={contact.id}
            className={clsx(
                'flex flex-row items-center justify-between py-4 focus:ring-blue-500 focus:border-blue-500',
                {
                'border-t': keyNum !== 0,
                },
            )}
        >
            <div className="flex grid grid-cols-2 gap-4 flex-1">
                <div className="flex items-left flex-1">
                    <p className="truncate text-sm font-semibold md:text-base">
                        {contact.fullname}
                    </p>
                </div>
                <div className="flex items-right flex-1">
                    <p className="hidden text-sm text-gray-500 sm:block">
                        {contact.location}
                    </p>
                </div>
                <div className="flex items-left flex-1 col-span-2">
                    <p className="truncate hidden text-sm text-gray-500 sm:block">
                        {contact.userbio}
                    </p>
                </div>

            </div>
        </div>
    )
};

export default ProfileCard