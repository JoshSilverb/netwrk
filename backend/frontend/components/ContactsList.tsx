import ProfileCard from '@/components/ProfileCard';
// import { FlatList } from 'react-native';
import { Contact } from '@/constants/Definitions';
import { Href } from 'expo-router';
import { View } from 'tamagui';


const ContactsList = ({ contacts} 
    :{ contacts: Contact[], address:Href<string>}) => {

    const profileCards = contacts.map(
        (contact: Contact) => <ProfileCard contact={contact} keyNum={contact.id} />);
  
    return (
        <View>{profileCards}</View>
    );
};

export default ContactsList;
