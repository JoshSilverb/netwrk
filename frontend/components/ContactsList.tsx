import ProfileCard from '@/components/ProfileCard';
import { Contact } from '@/constants/Definitions';
import { View } from 'tamagui';


const ContactsList = ({ contacts, prefix, onMorePressCallback} 
    :{ contacts: Contact[], prefix:String, onMorePressCallback?: () => void}) => {

    const profileCards = contacts.map(
        (contact: Contact) => <ProfileCard contact={contact} keyNum={contact.contact_id} onMorePressCallback={onMorePressCallback} key={`${prefix}-${contact.contact_id}`} />);
  
    return (
        <View>{profileCards}</View>
    );
};

export default ContactsList;
