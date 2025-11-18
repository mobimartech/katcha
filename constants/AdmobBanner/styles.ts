import { StyleSheet } from 'react-native';
import { useCommonStyles } from '~/theme';

const useStyles = () => {
  const commonStyles = useCommonStyles();
  const styles = StyleSheet.create({
    notificationContainer: {
      ...commonStyles.centerContent,
      marginRight: 25,
    },
    dot: {
      position: 'absolute',
      top: 0,
      right: 0,
    },
  });

  return {
    styles,
  };
};

export default useStyles;
