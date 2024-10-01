import { Auth } from 'aws-amplify';
import React from 'react';

export const useFirmId = () => {
  const [firmId, setFirmId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const checkFirmIdFromCognito = async () => {
    setLoading(true);
    const user = await Auth.currentAuthenticatedUser();
    const { attributes } = user;
    if (attributes?.['custom:firmId']) {
      setFirmId(attributes?.['custom:firmId']);
    } else setFirmId('');
    setLoading(false);
  };

  React.useEffect(() => {
    checkFirmIdFromCognito();
  }, []);

  return { loading: loading || firmId === null, firmId };
};
