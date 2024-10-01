import { useMemo } from 'react';
import { getFromS3Storage } from '@admiin-com/ds-amplify';
import { gql, useQuery } from '@apollo/client';
import {
  CSGetSub as GET_SUB,
  getUser as GET_USER,
} from '@admiin-com/ds-graphql';

interface UseUserSignatureReturn {
  userSignatureKey: string;
  getSignatureBlob: (signatureKey?: string) => Promise<Blob>;
}

export const useUserSignature = (): UseUserSignatureReturn => {
  const { data: subData } = useQuery(gql(GET_SUB));
  const userId = subData?.sub;

  const { data: userData } = useQuery(gql(GET_USER), {
    variables: {
      id: userId,
    },
    skip: !userId,
  });
  const userSignatureKey = useMemo(() => {
    return userData?.getUser?.selectedSignatureKey || '';
  }, [userData]);

  const getSignatureBlob = async (signatureKey = userSignatureKey) => {
    const urlBlob = await getFromS3Storage(
      signatureKey,
      null,
      'private',
      false,
      true
    );

    console.log('urlBlob: ', urlBlob);

    // Check if urlBlob.Body is a ReadableStream and convert it to a Blob
    let blob;
    if (urlBlob.Body instanceof Blob) {
      blob = urlBlob.Body;
    } else if (urlBlob.Body instanceof ReadableStream) {
      const reader = urlBlob.Body.getReader();
      const chunks = [];
      let done, value;

      while (!done) {
        ({ done, value } = await reader.read());
        if (value) {
          chunks.push(value);
        }
      }

      blob = new Blob(chunks, { type: urlBlob.ContentType });
    } else {
      throw new Error('Unknown Body type received from S3');
    }

    return blob;
  };

  return { getSignatureBlob, userSignatureKey };
};
