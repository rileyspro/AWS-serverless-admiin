const { ZAI_DOMAIN } = process.env;

// get zai bank account
interface Links {
  self: string;
  users: string;
  direct_debit_authorities: string;
}

export interface CreateBankRequest {
  user_id: string;
  bank_name: string;
  account_name: string;
  routing_number: string;
  account_number: string;
  account_type: 'savings' | 'checking';
  holder_type: 'personal' | 'business';
  country: string;
  payout_currency?: string;
  currency?: string;
}

export interface Bank {
  bank_name: string;
  country: string;
  account_name: string;
  routing_number: string;
  account_number: string;
  holder_type: 'personal' | 'business';
  account_type: 'savings' | 'checking';
  direct_debit_authority_status: 'null' | 'approved';
  links: Links;
}

export interface BankAccounts {
  active: boolean;
  created_at: string;
  updated_at: string;
  id: string;
  currency: string;
  verification_status: 'verified' | 'not_verified';
  bank: Bank;
}

export interface GetBankAccountResponse {
  bank_accounts: BankAccounts;
}

export const getZaiBankAccount = async (
  zaiAuthToken: string,
  bankAccountId: string
): Promise<GetBankAccountResponse> => {
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${zaiAuthToken}`,
    },
  };

  const response = await fetch(
    `${ZAI_DOMAIN}/bank_accounts/${bankAccountId}`,
    options
  );

  if (!response.ok) {
    const error = await response.text();
    console.log('ERROR getZaiBankAccount: ', JSON.stringify(error));
    throw new Error(`ERROR getZaiBankAccount: ${JSON.stringify(error)}`);
  }

  return response.json();
};

export const createZaiBankAccount = async (
  zaiAuthToken: string,
  bankAccount: CreateBankRequest
): Promise<GetBankAccountResponse> => {
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${zaiAuthToken}`,
    },
    body: JSON.stringify(bankAccount),
  };

  const response = await fetch(`${ZAI_DOMAIN}/bank_accounts`, options);

  if (!response.ok) {
    const error = await response.text();
    console.log('ERROR createZaiBankAccount: ', JSON.stringify(error));
    throw new Error(`ERROR createZaiBankAccount: ${JSON.stringify(error)}`);
  }

  return response.json();
};
