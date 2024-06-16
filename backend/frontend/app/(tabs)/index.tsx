import { Text, View } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import FeaturedProfiles from '@/components/FeaturedProfiles';
// import { Text, View } from '@/components/Themed';
import { Contacts } from '@/constants/PlaceholderData'

export default function DashboardScreen() {
  console.log("Contacts: ", Contacts)
  return (
    // <View className="flex-1 items-center justify-center">
    //   <Text className="font-bold">Index screen</Text>
    // </View>

    <View className="flex-1 flex-col  justify-start bg-slate-50	">
      {/* <View className="my-5 h-1" /> */}
      {/* <EditScreenInfo path="app/(tabs)/dashboard.tsx" /> */}
      <View className="flex-1 flex-column ">
        <View className="col-span-full mb-4 ">
          <Text h2 className="block m-2 text-base font-medium text-gray-900 dark:text-white 	">
              FEATURED CONTACTS
          </Text>
          <FeaturedProfiles profiles={Contacts.slice(0,3)} />
        </View>
      </View>
    </View>
  );
}

// const styles = StyleSheet.create({
  // container: {
    // flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
  // },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//   },
//   separator: {
//     marginVertical: 30,
//     height: 1,
//     width: '80%',
//   },
// });
