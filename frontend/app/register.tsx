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
import { Pressable, StyleSheet } from 'react-native';
import { HomePageUrl } from '@/constants/Definitions';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/Styles';

const TEAL = '#14B8A6';
const NAVY = '#0F172A';

export default function CreateAccountScreen() {
  const [username, setUsername] = useState('');
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
    try {
      const response = await axios.post(storeUserCredentialsURL, {
        username,
        password,
        location: location || null,
      });
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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAwareScrollView
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        {/* Navy header strip */}
        <View style={styles.navyStrip}>
          <Image
            width={68}
            height={68}
            borderRadius={16}
            source={require('../assets/images/netwrk-icon-square.png')}
            marginBottom={SPACING.sm}
          />
          <Text fontSize={26} fontWeight="800" color="white" letterSpacing={-0.5}>
            Netwrk
          </Text>
          <Text fontSize={TYPOGRAPHY.sizes.sm} color="rgba(255,255,255,0.55)" marginTop={4}>
            Create your account
          </Text>
        </View>

        {/* Form card — overlaps the strip, zIndex for autocomplete dropdown */}
        <YStack
          backgroundColor="$background"
          borderRadius={20}
          marginHorizontal={SPACING.md}
          borderWidth={1}
          borderColor="$borderColor"
          overflow="visible"
          marginTop={-SPACING.xl}
          marginBottom={SPACING.md}
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={0.08}
          shadowRadius={12}
          elevation={4}
          style={{ zIndex: 10 }}
        >
          {/* Username */}
          <YStack paddingHorizontal={SPACING.md} paddingTop={SPACING.md} paddingBottom={SPACING.xs} style={styles.topRadius}>
            <Text fontSize={11} fontWeight="600" color="$gray9" style={styles.label}>
              Username
            </Text>
          </YStack>
          <YStack paddingHorizontal={SPACING.md} paddingBottom={SPACING.md}>
            <Input
              placeholder="Enter username"
              value={username}
              onChangeText={setUsername}
              size="$4"
              autoCapitalize="none"
              borderWidth={0}
              backgroundColor="transparent"
            />
          </YStack>

          <View height={1} backgroundColor="$borderColor" />

          {/* Password */}
          <YStack paddingHorizontal={SPACING.md} paddingTop={SPACING.md} paddingBottom={SPACING.xs}>
            <Text fontSize={11} fontWeight="600" color="$gray9" style={styles.label}>
              Password
            </Text>
          </YStack>
          <YStack paddingHorizontal={SPACING.md} paddingBottom={SPACING.md}>
            <Input
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              size="$4"
              secureTextEntry
              borderWidth={0}
              backgroundColor="transparent"
            />
          </YStack>

          <View height={1} backgroundColor="$borderColor" />

          {/* Location */}
          <YStack paddingHorizontal={SPACING.md} paddingTop={SPACING.md} paddingBottom={SPACING.xs}>
            <XStack gap={6} alignItems="center">
              <Text fontSize={11} fontWeight="600" color="$gray9" style={styles.label}>
                Location
              </Text>
              <Text fontSize={11} color="$gray8" style={styles.label}>
                (optional)
              </Text>
            </XStack>
          </YStack>
          <YStack paddingBottom={SPACING.xs} style={{ zIndex: 20 }}>
            <CustomPlacesAutocomplete
              placeholder="Enter your location"
              onPress={(data) => setLocation(data.description)}
              disableScroll
              styles={{
                container: { flex: 0 },
                textInput: {
                  borderWidth: 0,
                  backgroundColor: 'transparent',
                  paddingHorizontal: SPACING.md,
                },
              }}
            />
          </YStack>
        </YStack>

        {error ? (
          <Text
            color="$red9"
            fontSize={TYPOGRAPHY.sizes.sm}
            textAlign="center"
            marginHorizontal={SPACING.md}
            marginBottom={SPACING.sm}
          >
            {error}
          </Text>
        ) : null}

        {/* Create Account button */}
        <Button
          marginHorizontal={SPACING.md}
          size="$4"
          backgroundColor={TEAL}
          color="white"
          fontWeight="700"
          borderRadius={BORDER_RADIUS.md}
          onPress={handleCreateAccount}
          marginBottom={SPACING.sm}
        >
          Create Account
        </Button>

        {/* Remember me */}
        <XStack marginTop={SPACING.xs} justifyContent="center" alignItems="center" gap={SPACING.sm}>
          <Checkbox
            id="rememberMeCheckBox"
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          >
            <Checkbox.Indicator>
              <CheckIcon />
            </Checkbox.Indicator>
          </Checkbox>
          <Label htmlFor="rememberMeCheckBox" fontSize={TYPOGRAPHY.sizes.sm} color="$gray10">
            Remember me
          </Label>
        </XStack>

        {/* Log in link */}
        <XStack marginTop={SPACING.xl} marginBottom={SPACING.xxl} justifyContent="center" alignItems="center" gap={4}>
          <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray10">
            Already have an account?
          </Text>
          <Pressable onPress={() => router.replace('/')}>
            <Text fontSize={TYPOGRAPHY.sizes.sm} color={TEAL} fontWeight="600">
              {' '}Log In
            </Text>
          </Pressable>
        </XStack>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flexGrow: 1,
  },
  navyStrip: {
    backgroundColor: NAVY,
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl + SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  topRadius: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
});
