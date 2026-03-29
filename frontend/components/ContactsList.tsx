import ProfileCard from '@/components/ProfileCard';
import { Contact } from '@/constants/Definitions';
import { View } from 'tamagui';

const ContactsList = ({ contacts, prefix }
    : { contacts: Contact[], prefix: string }) => {

    return (
        <View>
            {contacts.map((contact: Contact) => (
                <ProfileCard
                    contact={contact}
                    key={`${prefix}-${contact.contact_id}`}
                />
            ))}
        </View>
    );
};

export default ContactsList;
