import ProfileCard from '@/components/ProfileCard';
import { Text, View, FlatList, Linking } from 'react-native';
import { Contact } from '@/constants/Definitions';
import { Link } from 'expo-router';


const ContactsList = ({ contacts, address, header } : { contacts: Contact[], address:String }) => {

  return (
    <View className='flex-1 flex-col'>
      <FlatList
        ListHeaderComponent={header}
        className='flex-none'
        data={contacts}
        renderItem={({item} : {item:Contact}) => <ProfileCard contact={item} keyNum={item.id} />}
        keyExtractor={item => item.id}
      />
      <LinkButton text={"See all"} address={address}  />
    </View>
  );
};

const LinkButton = ({ text, address } : { text: String, address: String }) => {

  if (address) {
    return (
      <Link push href={address} className="mx-2 p-4 rounded-xl bg-slate-300" >
        <Text>More...</Text>
      </Link>
    );
  }
}

export default ContactsList;
