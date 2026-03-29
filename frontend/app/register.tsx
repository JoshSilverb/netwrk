import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { YStack, Input, Button, Text, XStack, Checkbox, Label, View, Image } from 'tamagui';
import axios from 'axios';
import { storeUserCredentialsURL } from '@/constants/Apis';
import CustomPlacesAutocomplete from '@/components/CustomPlacesAutocomplete';
import { useAuth } from '@/components/AuthContext';
import { Check as CheckIcon } from '@tamagui/lucide-icons';
import { saveToken, getToken } from '@/utils/tokenstore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { HomePageUrl } from '@/constants/Definitions';
import { SPACING, TYPOGRAPHY } from '@/constants/Styles';

export default function CreateAccountScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter();
  const { token, setToken } = useAuth();

  useEffect(() => {
    handleRetrieveSavedToken();
  }, []);

  const handleRetrieveSavedToken = async () => {
    const retrievedToken = await getToken();
    if (retrievedToken) {
      setToken(retrievedToken);
      setError('');
      router.replace(HomePageUrl);
    }
  };

  const handleCreateAccount = async () => {
    const requestBody = {
      username,
      password,
      location: location || null,
    };

    try {
      const response = await axios.post(storeUserCredentialsURL, requestBody);
      if (response.status === 200) {
        setError('');
        setToken(response.data['user_token']);
        if (rememberMe) {
          await saveToken(response.data['user_token']);
        }
        router.replace(HomePageUrl);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err) {
      if (__DEV__) console.error('Error creating account:', err);
      setError('Could not create account. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          backgroundColor="$background"
          paddingHorizontal={SPACING.lg}
          paddingVertical={SPACING.xxl}
        >
          {/* Brand block */}
          <YStack alignItems="center" marginBottom={SPACING.xl}>
            <Image
              width={80}
              height={80}
              borderRadius={16}
              source={require('../assets/images/netwrk-icon-square.png')}
              marginBottom={SPACING.sm}
            />
            <Text
              fontSize={TYPOGRAPHY.sizes.title}
              fontWeight={TYPOGRAPHY.weights.bold}
              color="$blue9"
            >
              Netwrk
            </Text>
          </YStack>

          <Text
            fontSize={TYPOGRAPHY.sizes.xl}
            fontWeight={TYPOGRAPHY.weights.bold}
            marginBottom={SPACING.lg}
            color="$color"
          >
            Create Account
          </Text>

          {/* Form */}
          <YStack width="100%" space={SPACING.xs}>
            <Text
              fontSize={TYPOGRAPHY.sizes.sm}
              fontWeight={TYPOGRAPHY.weights.medium}
              color="$gray11"
              marginBottom={SPACING.xs}
            >
              Username
            </Text>
            <Input
              id="username"
              placeholder="Enter username"
              value={username}
              onChangeText={setUsername}
              size="$4"
              width="100%"
              autoCapitalize="none"
            />

            <Text
              fontSize={TYPOGRAPHY.sizes.sm}
              fontWeight={TYPOGRAPHY.weights.medium}
              color="$gray11"
              marginTop={SPACING.md}
              marginBottom={SPACING.xs}
            >
              Password
            </Text>
            <Input
              id="password"
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              size="$4"
              width="100%"
              secureTextEntry
            />

            <Text
              fontSize={TYPOGRAPHY.sizes.sm}
              fontWeight={TYPOGRAPHY.weights.medium}
              color="$gray11"
              marginTop={SPACING.md}
              marginBottom={SPACING.xs}
            >
              Location{' '}
              <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray9">
                (optional)
              </Text>
            </Text>
            <View
              width="100%"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius={8}
              backgroundColor="$background"
            >
              <CustomPlacesAutocomplete
                placeholder="Enter your location"
                onPress={(data) => {
                  setLocation(data.description);
                }}
                disableScroll={true}
                styles={{
                  container: { flex: 0 },
                  textInput: { borderWidth: 0, backgroundColor: 'transparent' },
                }}
              />
            </View>

            {error ? (
              <Text color="$red9" marginTop={SPACING.sm} textAlign="center">
                {error}
              </Text>
            ) : null}

            <Button
              marginTop={SPACING.lg}
              width="100%"
              size="$4"
              backgroundColor="$blue9"
              color="white"
              onPress={handleCreateAccount}
              fontWeight={TYPOGRAPHY.weights.bold}
            >
              Create Account
            </Button>

            <XStack marginTop={SPACING.md} justifyContent="center" alignItems="center" space={SPACING.sm}>
              <Checkbox
                id="rememberMeCheckBox"
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              >
                <Checkbox.Indicator>
                  <CheckIcon />
                </Checkbox.Indicator>
              </Checkbox>
              <Label htmlFor="rememberMeCheckBox" fontSize={TYPOGRAPHY.sizes.sm}>
                Remember me
              </Label>
            </XStack>

            <XStack marginTop={SPACING.lg} justifyContent="center" alignItems="center" space={SPACING.sm}>
              <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray10">
                Already have an account?
              </Text>
              <Button
                variant="outlined"
                size="$2"
                onPress={() => router.replace('/')}
                fontSize={TYPOGRAPHY.sizes.sm}
              >
                Log In
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
