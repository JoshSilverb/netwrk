import React, {useState} from 'react';
import ProfileCard from '@/components/ProfileCard';
import { SafeAreaView, Text, View, FlatList, TouchableHighlight, Linking, Pressable, Button } from 'react-native';
import { Contact } from '@/constants/Definitions';
import { Link } from 'expo-router';
import clsx from 'clsx';


const ContactsList = ({ contacts, address } : { contacts: Contact[], link:String }) => {
  // const [count, setCount] = useState(0);
  // const onPress = () => setCount(count + 1);
  const onPress = () => Linking.openURL('/(tabs)/contacts');

  return (
    
    <SafeAreaView >
      <FlatList
        data={contacts}
        renderItem={({item} : {item:Contact}) => <ProfileCard contact={item} key={item.id} />}
        keyExtractor={item => item.id}
      />
      <LinkButton text={"See all"} address={address}  />
    </SafeAreaView>

  );
};

const LinkButton = ({ text, address } : { text: String, address: String }) => {

  if (address) {
    return (


            <Link push href={address} className="items-start mx-2 p-4 rounded-xl bg-slate-300" >
              <Text>More...</Text>
            </Link>
          //   <View style={styles.buttonContainer}>
          //   <Button onPress={this._onPressButton} title="Press Me" />
          // </View>
    );
  }
}

export default ContactsList;











// import React from 'react';

// import { Contact } from '@/constants/Definitions';
// import ProfileCard from '@/components/ProfileCard';
// import { View } from 'react-native';

// export default async function ContactsList({
//     contacts,
//   }: {
//     contacts: Contact[];
//   }) {
//     return (

//       <View className=" rounded-xl bg-gray-50 p-4 overflow-y-auto ">
//         {profiles.map((profile, key) => (
//           <ProfileCard contact={profile} key={key} />
//         ))}
//         <View className="flex flex-row items-center justify-between py-4 focus:ring-blue-500 focus:border-blue-500 block text-base font-medium text-gray-900 dark:text-white border-t-2">
//           <Text onPress={() => Linking.openURL('/contacts')}>
//             See all
//           </Text>
//         </View>
//     </View>


//       // <View className="flex w-full flex-col md:col-span-8">
//       //   <View className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4">
//       //     <View className='flex w-full flex-col md:col-span-8'>
//       //         <View className="relative flex items-center w-full h-12 rounded-lg focus-within:shadow-lg bg-white overflow-hidden border-2">
//       //             <View className="grid place-items-center h-full w-12 text-gray-300">
//       //                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//       //                 </svg>
//       //             </View>
  
//       //             <input
//       //             className="peer h-full w-full outline-none text-sm text-gray-700 pr-2"
//       //             type="text"
//       //             id="search"
//       //             placeholder="Search contacts.." /> 
//       //         </View>
//       //     </View>
        
  
//       //     <View className="bg-white px-6">
//       //       {contacts.map((profile, key) => (
//       //       <ProfileCard contact={profile} key={key} />
//       //     ))}
//       //     </View>
//       //   </View>
//       // </View>
//     );
// };

