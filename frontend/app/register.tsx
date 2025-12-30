import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { YStack, Input, Button, Text, XStack, Checkbox, Label, ScrollView, View, Image } from 'tamagui';
import axios from 'axios';
import { storeUserCredentialsURL } from '@/constants/Apis';
import { useAuth } from '@/components/AuthContext';
import { Check as CheckIcon } from '@tamagui/lucide-icons';
import { saveToken, getToken } from '@/utils/tokenstore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { HomePageUrl } from '@/constants/Definitions';

export default function createAccountScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phonenumber, setphonenumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter();

  const { token, setToken } = useAuth();

  useEffect(() => {
    handleRetrieveSavedToken();
  }, [])

  const handleRetrieveSavedToken = async () => {
    const retrievedToken = await getToken();
    if (retrievedToken) {
      console.log("Retrieved saved token:", retrievedToken);
      setToken(retrievedToken);
      setError('');
      router.replace(HomePageUrl);
    }
    else {
      console.log("No saved token");
    }
  }

  const handleCreateAccount = async () => {
    // Login form data to be sent
    const requestBody = {
      username: username,
      password: password
    }

    try {
      const response = await axios.post(storeUserCredentialsURL, requestBody);
      if (response.status == 200) {
        setError('');
        setToken(response.data['user_token']);
        if (rememberMe) {
          console.log("Saving token:", response.data['user_token']);
          await saveToken(response.data['user_token']);
        }
        router.replace(HomePageUrl);
      }
      else {
        setError('Invalid username or password.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top', 'bottom']}>
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1 }}
    >
    <YStack
      f={1}
      alignItems="center"
      justifyContent="center"
      backgroundColor="$background"
      paddingTop={10}
      // px="$4"
      // space
    >
      <XStack
        backgroundColor={'#1473CBFF'} 
        marginBottom={30}
        alignItems="center"
        justifyContent="center"
      >
        <Image width={100} height={100} source={require('../assets/images/netwrk-icon-square.png')} />
        <Text marginRight={32} fontSize={32} color={'#FFFFFF'}>
          Netwrk
        </Text>
      </XStack>
      <Text fontFamily="$heading" fontSize="$7" color="$color" mb="$4">
        Create Account
      </Text>
      <Label htmlFor="username" mb="$2">
        Username
      </Label>
      <Input
        id="username"
        placeholder="Enter username"
        value={username}
        onChangeText={setUsername}
        width="$12"
        size="$4"
        borderWidth="$0.5"
      />
      <Label htmlFor="email" mb="$2">
        Email
      </Label>
      <Input
        id="email"
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
        width="$12"
        size="$4"
        borderWidth="$0.5"
      />
      <Label htmlFor="password" mt="$3" mb="$2">
        Password
      </Label>
      <Input
        id="password"
        placeholder="Enter password"
        value={password}
        onChangeText={setPassword}
        width="$12"
        size="$4"
        secureTextEntry
        borderWidth="$0.5"
      />
      {error && (
        <Text color="$red9" mt="$3">
          {error}
        </Text>
      )}

      <Button
        mt="$4"
        width="$12"
        size="$4"
        onPress={handleCreateAccount}
      >
        Create account
      </Button>
      <XStack mt="$4" jc="center" ai="center" space="$2">
        <Checkbox 
          id="rememberMeCheckBox"
          onCheckedChange={(checked) => setRememberMe(checked)}
        >
          <Checkbox.Indicator>
            <CheckIcon />
          </Checkbox.Indicator>  
        </Checkbox>
        <Label htmlFor="rememberMeCheckBox">Remember me</Label>
      </XStack>
      
      <XStack mt="$4" jc="center" ai="center" space="$5">
        <Text>Already have an account?</Text>
        <Button
          variant="link"
          onPress={() => {
            router.replace('/');
          }}
        >
          Log In
        </Button>
      </XStack>
    </YStack>
    </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
