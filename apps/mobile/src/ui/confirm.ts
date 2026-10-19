import { Alert } from 'react-native';
export function confirm(title: string, message: string, accept = '确认'): Promise<boolean> {
  return new Promise((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: '取消', style: 'cancel', onPress: () => resolve(false) },
        { text: accept, onPress: () => resolve(true) },
      ],
      { cancelable: false },
    ),
  );
}
