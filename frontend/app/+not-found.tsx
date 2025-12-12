import { Link, Stack } from 'expo-router';
import { Text, View, Button } from 'tamagui';
import { SPACING, TYPOGRAPHY, CONTAINER_STYLES } from '@/constants/Styles';
import { HomePageUrl } from '@/constants/Definitions';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={CONTAINER_STYLES.screen}>
        <View 
          flex={1}
          alignItems="center"
          justifyContent="center"
          padding={SPACING.lg}
        >
          <Text 
            fontSize={TYPOGRAPHY.sizes.lg}
            fontWeight={TYPOGRAPHY.weights.bold}
            marginBottom={SPACING.lg}
            textAlign="center"
          >
            This screen doesn't exist.
          </Text>

          <Link href={HomePageUrl} asChild>
            <Button 
              size="$3"
              backgroundColor="$blue9"
              color="white"
            >
              Go to home screen!
            </Button>
          </Link>
        </View>
      </View>
    </>
  );
}
