import { router } from 'expo-router';
import { Button, Body, Screen, Title } from '../components/ui';
import { ROUTES } from '../constants/routes';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Title>We couldn’t find that screen.</Title>
      <Body>Head back to the Safety Hub to continue.</Body>
      <Button title="Go to Safety Hub" onPress={() => router.replace(ROUTES.hub)} />
    </Screen>
  );
}
