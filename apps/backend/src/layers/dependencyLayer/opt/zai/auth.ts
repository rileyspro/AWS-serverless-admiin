import {
  CreateZaiAuthTokenResponse,
  CreatePaymentMethodTokenRequest,
  CreatePaymentMethodTokenResponse,
} from 'dependency-layer/zai/auth.types';

const { ZAI_DOMAIN, ZAI_TOKEN_DOMAIN, ZAI_CLIENT_ID, ZAI_CLIENT_SCOPE } =
  process.env;

export const createZaiAuthToken = async ({
  zaiClientSecret,
}: {
  zaiClientSecret: string;
}): Promise<CreateZaiAuthTokenResponse> => {
  if (!zaiClientSecret) {
    throw new Error('ZAI_CLIENT_S_MISSING');
  }

  if (!ZAI_TOKEN_DOMAIN) {
    throw new Error('ZAI_TOKEN_DOMAIN_MISSING');
  }

  if (!ZAI_CLIENT_SCOPE) {
    throw new Error('ZAI_SCOPE_MISSING');
  }

  const options = {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: ZAI_CLIENT_ID,
      client_secret: zaiClientSecret,
      scope: ZAI_CLIENT_SCOPE,
    }),
  };

  const response = await fetch(`${ZAI_TOKEN_DOMAIN}/tokens` ?? '', options);

  if (!response.ok) {
    const error = await response.text();
    console.log('ERROR createZaiAuthToken: ', JSON.stringify(error));
    throw new Error(`ERROR createZaiAuthToken: ${JSON.stringify(error)}`);
  }

  const tokenIssueTime = Date.now();
  const data: { access_token: string; expires_in: number; token_type: string } =
    await response.json();
  const token_expires_at = tokenIssueTime + data.expires_in * 1000;

  return {
    ...data,
    token_expires_at,
  };
};

// check if expired with 5 minute buffer
export const isAuthTokenExpired = (
  zaiAuthToken?: CreateZaiAuthTokenResponse
): boolean => {
  return (
    !zaiAuthToken ||
    !zaiAuthToken.access_token ||
    !zaiAuthToken.token_expires_at ||
    Date.now() + 5 * 60 * 1000 >= zaiAuthToken.token_expires_at
  );
};

export const createPaymentMethodToken = async (
  zaiAuthToken: string,
  request: CreatePaymentMethodTokenRequest
): Promise<CreatePaymentMethodTokenResponse> => {
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${zaiAuthToken}`,
    },
    body: JSON.stringify(request),
  };

  const response = await fetch(`${ZAI_DOMAIN}/token_auths`, options);

  if (!response.ok) {
    const error = await response.text();
    console.log('ERROR createPaymentMethodToken: ', JSON.stringify(error));
    throw new Error(`ERROR createPaymentMethodToken: ${JSON.stringify(error)}`);
  }

  return response.json();
};
