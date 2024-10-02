import ProfileCard from '@/components/ProfileCard';
import { Contact } from '@/constants/Definitions';
import { View } from 'tamagui';


const ContactsList = ({ contacts} 
    :{ contacts: Contact[]}) => {

    const profileCards = contacts.map(
        (contact: Contact) => <ProfileCard contact={contact} keyNum={contact.id} />);
  
    return (
        <View>{profileCards}</View>
    );
};

export default ContactsList;
