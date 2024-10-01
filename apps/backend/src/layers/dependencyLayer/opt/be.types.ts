import { Contact, Entity } from 'dependency-layer/API';

export interface PaymentAccount {
  id: string;
  compositeId?: string; // userId#billerCode#reference OR userId#bsb#accountNumber
  //entityId: string;
  //idOwner: string;
  //idOwnerType: IdOwnerType;
  //reference?: string;
  bpayReferenceNumber?: string;
  billerCode?: number;
  provider: 'ZAI';
  paymentUserId: string;
  providerCompanyId?: string; // TODO, is this required?
  providerAccountId: string;
  paymentAccountType: PaymentAccountType;
  direction: PaymentAccountDirection;
  createdAt: string;
  updatedAt: string;
}

export enum IdOwnerType {
  ENTITY = 'ENTITY',
  CONTACT = 'CONTACT',
}

export enum PaymentAccountType {
  BPAY = 'BPAY',
  BANK = 'BANK',
}

export enum PaymentAccountDirection {
  PAY_IN = 'PAY_IN',
  PAY_OUT = 'PAY_OUT',
}

export interface BEContact extends Contact {
  paymentUserId: string;
}

export interface BEEntity extends Entity {
  ipAddress?: string;
}
