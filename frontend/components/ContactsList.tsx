import ProfileCard from '@/components/ProfileCard';
import { Contact } from '@/constants/Definitions';
import { YStack } from 'tamagui';

const ContactsList = ({ contacts, prefix }
    : { contacts: Contact[], prefix: string }) => {

    return (
        <YStack borderTopWidth={1} borderTopColor="$borderColor">
            {contacts.map((contact: Contact) => (
                <ProfileCard
                    contact={contact}
                    key={`${prefix}-${contact.contact_id}`}
                />
            ))}
        </YStack>
    );
};

export default ContactsList;
