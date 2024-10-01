// TODO: should be in more relevant file? (not Zai specific?)
import {
  BillsPaymentInput,
  Contact,
  CreateTaskInput,
  CreateTaskStatus,
  Entity,
  EntityType,
  EntityUser,
  FromToType,
  Payment,
  PaymentFrequency,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  PayToAgreement,
  Task,
  TaskCategory,
  TaskDirection,
  TaskPaymentStatus,
  TaskSignatureStatus,
  TaskStatus,
  TaskType,
  UpdateTaskInput,
  UpdateTaskPaymentStatus,
  UpdateTaskStatus,
  VerificationStatus,
} from 'dependency-layer/API';
import { BEContact } from 'dependency-layer/be.types';
import { isPastDate, isTodayDate } from 'dependency-layer/dates';
import { getRecord } from 'dependency-layer/dynamoDB';
import { GetFromToData } from 'dependency-layer/zai/payment';
import { util } from '@aws-appsync/utils';

// TODO: SEPARATE FILE INTO TWO - TASK & PAYMENT. INTO LAMBDA LAYER?

export const validatePaymentMethod = (paymentMethod: PaymentMethod | null) => {
  if (!paymentMethod) {
    throw new Error('INVALID_PAYMENT_METHOD'); // payment method doesn't exist
  }

  return paymentMethod;
};

export const validateFeeId = (feeIds: string[] | undefined) => {
  if (!feeIds || feeIds.length === 0) {
    throw new Error('ERROR_GETTING_PAYMENT_FEE');
  }
};

export const validatePayNow = ({
  scheduledAt,
  installments,
  numberOfPayments,
}: {
  scheduledAt: string;
  installments: number;
  numberOfPayments?: number;
}) => {
  // if scheduled is today
  if (scheduledAt) {
    if (isTodayDate(scheduledAt)) {
      throw new Error('SCHEDULED_AT_MUST_BE_TODAY_PAY_NOW');
    }
  }

  // if installments is not 1
  if (installments !== 1 && numberOfPayments !== installments) {
    throw new Error('INVALID_INSTALLMENTS_PAY_NOW');
  }
};

export const validateScheduled = ({
  scheduledAt,
  installments,
  numberOfPayments,
}: {
  scheduledAt: string;
  installments: number;
  numberOfPayments?: number;
}) => {
  if (!scheduledAt) {
    throw new Error('SCHEDULED_AT_REQUIRED');
  }

  // if scheduled at in the past
  if (isPastDate(scheduledAt)) {
    throw new Error('SCHEDULED_AT_IN_PAST');
  }

  // if scheduled is today
  if (isTodayDate(scheduledAt)) {
    throw new Error('SCHEDULED_AT_CANNOT_BE_TODAY');
  }

  // if installments is not 1
  if (installments !== 1 && installments !== numberOfPayments) {
    throw new Error('INVALID_INSTALLMENTS_SCHEDULED');
  }
};

export const validateInstallments = ({
  installments,
  scheduledAt,
  category,
  paymentFrequency,
}: {
  installments?: number | null;
  scheduledAt: string;
  category?: string | null;
  paymentFrequency?: PaymentFrequency | null;
}) => {
  if (!installments) {
    throw new Error('INSTALLMENTS_REQUIRED');
  }

  // TODO: ato bill should only allow this, but business pay installments should only be 3
  if (
    category === TaskCategory.TAX &&
    (installments < 2 || installments > 24)
  ) {
    throw new Error('TAX_INVALID_INSTALLMENTS');
  }

  if (category !== TaskCategory.TAX && installments !== 3) {
    throw new Error('INVALID_INSTALLMENTS');
  }

  if (!scheduledAt) {
    throw new Error('SCHEDULED_AT_REQUIRED');
  }

  // if scheduled at in the past
  if (isPastDate(scheduledAt)) {
    throw new Error('SCHEDULED_AT_IN_PAST');
  }

  if (paymentFrequency === PaymentFrequency.ONCE || !paymentFrequency) {
    throw new Error('INVALID_PAYMENT_FREQUENCY');
  }
};

export const validateEntityUser = (entityUser: EntityUser) => {
  if (!entityUser) {
    throw new Error('UNAUTHORISED_ENTITY');
  }
};

export const validateBill = (task: Task) => {
  if (!task) {
    throw new Error('ERROR_GETTING_BILL');
  }

  if (!task.amount) {
    throw new Error('BILL_AMOUNT_REQUIRED');
  }

  if (task.paymentStatus !== TaskPaymentStatus.PENDING_PAYMENT) {
    throw new Error('BILL_NOT_PAYABLE');
  }
};

export const validateBills = (
  tasks: Task[],
  billPayments: BillsPaymentInput[],
  entityId: string
) => {
  if (!entityId) {
    throw new Error('INVALID_ENTITY');
  }

  if (!tasks) {
    throw new Error('ERROR_GETTING_BILLS');
  }

  if (tasks.length === 0) {
    throw new Error('BILLS_REQUIRED');
  }

  if (billPayments?.length !== tasks.length) {
    throw new Error('ONE_OR_MORE_BILLS_INVALID');
  }

  tasks.forEach((task) => {
    const billPayment = billPayments.find(
      (billPayment: BillsPaymentInput) => billPayment.id === task.id
    );

    console.log('billPayment: ', billPayment);

    if (!billPayment) {
      throw new Error(`UNABLE_TO_MATCH_BILL_PAYMENT`);
    }

    if (!task.amount) {
      throw new Error('BILL_AMOUNT_REQUIRED');
    }

    if (task.paymentStatus !== TaskPaymentStatus.PENDING_PAYMENT) {
      throw new Error('BILLS_NOT_PAYABLE');
    }

    if (task.entityId !== entityId) {
      throw new Error('INVALID_ENTITY_BILLS');
    }

    if (billPayment.paymentType === PaymentType.PAY_NOW) {
      validatePayNow({
        scheduledAt: billPayment.scheduledAt,
        installments: billPayment.installments,
        numberOfPayments: task.numberOfPayments ?? 1,
      });
    }

    // scheduled validation
    if (billPayment.paymentType === PaymentType.SCHEDULED) {
      validateScheduled({
        scheduledAt: billPayment.scheduledAt,
        installments: billPayment.installments,
        numberOfPayments: task.numberOfPayments ?? 1,
      });
    }

    // installments validation
    if (billPayment.paymentType === PaymentType.INSTALLMENTS) {
      validateInstallments({
        installments: billPayment.installments,
        scheduledAt: billPayment.scheduledAt,
        category: task.category,
        paymentFrequency: billPayment.paymentFrequency,
      });
    }
  });
};

export const validatePayToTasks = (tasks: Task[]) => {
  // ensure each task is pending PAYTO
  const isPayToPending = !tasks.some(
    (task) =>
      task.paymentStatus !== TaskPaymentStatus.PENDING_PAYTO_AGREEMENT_CREATION
  );

  if (!isPayToPending) {
    throw new Error('TASKS_NOT_PENDING_PAYTO');
  }

  // ensure each task has an agreement id
  const hasAgreementId = !tasks.some((task) => !task.agreementUuid);

  if (!hasAgreementId) {
    throw new Error('TASKS_MISSING_AGREEMENT_ID');
  }
};

export const validateEntityTo = (entity: Entity) => {
  if (!entity) {
    throw new Error('NO_ENTITY');
  }

  if (!entity.id) {
    throw new Error('NO_CONTACT_TO_PAYMENT_USER_ID');
  }

  if (
    entity.verificationStatus !== VerificationStatus.PASS &&
    entity.verificationStatus !== VerificationStatus.PASS_MANUAL
  ) {
    throw new Error('ENTITY_NOT_VERIFIED');
  }

  if (!entity.contact) {
    throw new Error('NO_ENTITY_TO_CONTACT');
  }

  if (!entity.contact.firstName || !entity.contact.lastName) {
    throw new Error('MISSING_ENTITY_CONTACT_DETAILS');
  }

  if (!entity.contact.phone) {
    throw new Error('NO_TO_PHONE');
  }

  if (!entity.legalName) {
    throw new Error('NO_ENTITY_LEGAL_NAME');
  }

  //if (!entity.taxNumber) {
  //  throw new Error('NO_ENTITY_TAX_NUMBER');
  //}
};

export const validateContactTo = (contact: BEContact) => {
  if (!contact) {
    throw new Error('ERROR_GET_CONTACT_TO');
  }

  if (!contact.paymentUserId) {
    throw new Error('NO_CONTACT_TO_PAYMENT_USER_ID');
  }
};

export const validateEntityFrom = (entity: Entity | null) => {
  if (!entity) {
    throw new Error('ERROR_GET_ENTITY_FROM');
  }

  // check if owner exists, which will be zai user id for non-bpay entity. Boay entity we create the zai user
  if (entity.type !== EntityType.BPAY && !entity.paymentUserId) {
    throw new Error('NO_FROM_ENTITY_PAYMENT_PROVIDER');
  }

  // if entity is not bpay type, ensure verified
  if (
    entity.type !== EntityType.BPAY &&
    entity.verificationStatus !== VerificationStatus.PASS &&
    entity.verificationStatus !== VerificationStatus.PASS_MANUAL
  ) {
    throw new Error('NO_FROM_ENTITY_NOT_VERIFIED');
  }

  if (!entity.contact) {
    throw new Error('NO_FROM_ENTITY_CONTACT');
  }

  if (!entity.contact.phone) {
    throw new Error('NO_FROM_ENTITY_PHONE');
  }

  // validate abn
  if (!isValidABN(entity.taxNumber)) {
    throw new Error('NO_FROM_ENTITY_ABN');
  }

  if (entity.type !== EntityType.BPAY && !entity.disbursementMethodId) {
    throw new Error('NO_FROM_ENTITY_BANK_ACCOUNT');
  }

  //TODO: validate account for payout attached
};

export const validateContactFrom = (contact: BEContact | null) => {
  if (!contact) {
    throw new Error('ERROR_GET_CONTACT_FROM');
  }

  // validate abn
  if (!isValidABN(contact.taxNumber)) {
    throw new Error('NO_FROM_CONTACT_ABN');
  }

  if (!contact?.bank?.accountNumber || !contact?.bank?.routingNumber) {
    throw new Error('NO_FROM_CONTACT_BANK_ACCOUNT');
  }

  //TODO: validate account for payout attached
};

export const validatePayToAgreements = (agreements: PayToAgreement[]) => {
  if (!agreements) {
    throw new Error('ERROR_GETTING_AGREEMENTS');
  }

  if (agreements.length === 0) {
    throw new Error('AGREEMENTS_REQUIRED');
  }

  const isSameEntity = !agreements.some(
    (agreement) => agreement.entityId !== agreements[0].entityId
  );

  if (!isSameEntity) {
    throw new Error('AGREEMENTS_NOT_SAME_ENTITY');
  }
};

export const validateToFromData = (data: GetFromToData) => {
  if (!data.buyerId) {
    throw new Error('ERROR_GET_BUYER');
  }

  if (!data.sellerId) {
    throw new Error('ERROR_GET_SELLER');
  }

  if (!data.sellerPhone) {
    throw new Error('ERROR_GET_SELLER_PHONE');
  }
};

export const validatePayment = ({ payment }: { payment?: Payment }) => {
  if (!payment) {
    throw new Error('ERROR_GET_PAYMENT');
  }

  if (payment.status === PaymentStatus.COMPLETED) {
    throw new Error('PAYMENT_ALREADY_COMPLETED');
  }
};

export const getCustomDescriptor = ({ name }: { name: string }) => {
  if (name.length > 13) {
    return name.substring(0, 13);
  }

  return name;
};

// TODO import from @admiin-com/ds-common ? Maybe need to add path to tsconfig
export const isValidPRN = (prn: string): boolean => {
  // Check if PRN is the correct length and numeric
  if (!/^\d{16,18}$/.test(prn)) {
    return false;
  }

  // Ensure PRN is 18 characters long, padding with leading zeros if needed
  const paddedPRN = prn.padStart(18, '0');

  // Extract parts of the PRN
  const first14Digits = paddedPRN.substring(0, 14);
  const checkDigits = parseInt(paddedPRN.substring(14, 16), 10);
  const last2Digits = paddedPRN.substring(16);

  // Calculate check digit
  const weights = [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    sum += parseInt(first14Digits.charAt(i), 10) * weights[i];
  }
  // Adding the last 2 digits to the sum
  sum +=
    parseInt(last2Digits.charAt(0), 10) * weights[14] +
    parseInt(last2Digits.charAt(1), 10) * weights[15];

  const calculatedCheckDigit = 97 - (sum % 97);

  // Compare the calculated check digit with the one in the PRN
  return checkDigits === calculatedCheckDigit;
};

// TODO import from @admiin-com/ds-common ? Maybe need to add path to tsconfig

export const isValidABN = (abn?: string | null): boolean => {
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  // check if exists and is 11 characters
  if (!abn || abn.length !== 11) {
    return false;
  }

  // ato check method
  let sum = 0;
  weights.forEach((weight, position) => {
    const digit = Number(abn[position]) - (position ? 0 : 1);
    sum += weight * digit;
  });

  const checksum = sum % 89;
  return checksum === 0;
};

export const validateArchiveTask = (
  existingPaymentStatus: TaskPaymentStatus,
  existingSignStatus: TaskSignatureStatus
) => {
  if (
    existingPaymentStatus !== TaskPaymentStatus.PENDING_PAYMENT &&
    existingPaymentStatus !== TaskPaymentStatus.NOT_PAYABLE
  ) {
    util.error('INVALID_ARCHIVE_PAYMENT_STATUS');
  }

  if (
    existingSignStatus !== TaskSignatureStatus.PENDING_SIGNATURE &&
    existingSignStatus !== TaskSignatureStatus.NOT_SIGNABLE
  ) {
    util.error('INVALID_ARCHIVE_SIGN_STATUS');
  }
};

export const validateNewTask = (input: CreateTaskInput | UpdateTaskInput) => {
  if (input.toId === input.fromId) {
    throw new Error('TASK_TO_FROM_SAME');
  }

  if (input.type === TaskType.SIGN_PAY || input.type === TaskType.PAY_ONLY) {
    if (!input.amount || input.amount <= 0) {
      throw new Error('TASK_AMOUNT_INVALID');
    }
  }

  if (input.type === TaskType.SIGN_PAY || input.type === TaskType.SIGN_ONLY) {
    if (!input.documents || input.documents.length === 0) {
      throw new Error('TASK_DOCUMENTS_REQUIRED');
    }
  }

  // if payment type includes INSTALLMENTS but is not once off
  if (
    (input.type === TaskType.SIGN_PAY || input.type === TaskType.PAY_ONLY) &&
    input.paymentTypes?.includes(PaymentType.INSTALLMENTS) &&
    input.paymentFrequency !== PaymentFrequency.ONCE
  ) {
    throw new Error('INSTALLMENTS_ONLY_WITH_ONCE_OFF');
  }

  if (
    (input.type === TaskType.SIGN_PAY || input.type === TaskType.PAY_ONLY) &&
    !input.paymentTypes?.includes(PaymentType.PAY_NOW)
  ) {
    throw new Error('PAY_NOW_REQUIRED');
  }
};

export const validateExistingTask = (
  { status, paymentStatus, toId, toType, fromId, fromType }: UpdateTaskInput,
  existingTask: Task
) => {
  if (!existingTask) {
    throw new Error('TASK_NOT_FOUND');
  }

  if (
    (toId && existingTask.toId !== toId) ||
    (toType && existingTask.toType !== toType)
  ) {
    throw new Error('CHANGE_TO_NOT_ALLOWED');
  }

  if (
    (fromId && existingTask.fromId !== fromId) ||
    (fromType && existingTask.fromType !== fromType)
  ) {
    throw new Error('CHANGE_FROM_NOT_ALLOWED');
  }

  // marked as paid validiation
  if (
    paymentStatus === UpdateTaskPaymentStatus.MARKED_AS_PAID &&
    existingTask.paymentStatus !== TaskPaymentStatus.PENDING_PAYMENT
  ) {
    throw new Error('INVALID_PAYMENT_STATUS');
  }

  // mark as unpaid validiation
  if (
    paymentStatus === UpdateTaskPaymentStatus.PENDING_PAYMENT &&
    existingTask.paymentStatus !== TaskPaymentStatus.MARKED_AS_PAID &&
    existingTask.paymentStatus !== TaskPaymentStatus.PENDING_PAYMENT
  ) {
    throw new Error('INVALID_PAYMENT_STATUS');
  }

  // archived task only allowed if not paid / signed
  if (status === UpdateTaskStatus.ARCHIVED) {
    if (
      existingTask.paymentStatus !== TaskPaymentStatus.PENDING_PAYMENT &&
      existingTask.paymentStatus !== TaskPaymentStatus.NOT_PAYABLE
    ) {
      throw new Error('INVALID_ARCHIVE_PAYMENT_STATUS');
    }

    if (
      existingTask.signatureStatus !== TaskSignatureStatus.PENDING_SIGNATURE &&
      existingTask.signatureStatus !== TaskSignatureStatus.NOT_SIGNABLE
    ) {
      throw new Error('INVALID_ARCHIVE_SIGN_STATUS');
    }
  }

  if (status === UpdateTaskStatus.INCOMPLETE) {
    if (
      existingTask.status !== TaskStatus.DRAFT &&
      existingTask.status !== TaskStatus.INCOMPLETE
    ) {
      throw new Error('EXISTING_TASK_NOT_DRAFT');
    }
  }
};

export const validateTaskToFrom = async (
  input: CreateTaskInput | UpdateTaskInput
): Promise<{
  entityTo: Entity | undefined;
  contactTo: Contact | undefined;
  entityFrom: Entity | undefined;
  contactFrom: Contact | undefined;
}> => {
  const { TABLE_ENTITY, TABLE_CONTACT } = process.env;
  let entityTo;
  let contactTo;
  let entityFrom;
  let contactFrom;
  if (input.toType === FromToType.ENTITY) {
    try {
      entityTo = await getRecord(TABLE_ENTITY ?? '', {
        id: input.toId,
      });
      console.log('buyerEntity: ', entityTo);
    } catch (err: any) {
      console.log('ERROR get entity: ', err);
      throw new Error(err.message);
    }

    if (!entityTo) {
      throw new Error('ENTITY_TO_NOT_FOUND');
    }
  }

  // payment buyer is a contact
  else if (input.toType === FromToType.CONTACT) {
    try {
      contactTo = await getRecord(TABLE_CONTACT ?? '', {
        id: input.toId,
      });

      console.log('buyerContact: ', contactTo);
    } catch (err: any) {
      console.log('ERROR get contact: ', err);
      throw new Error(err.message);
    }

    if (!contactTo) {
      throw new Error('CONTACT_TO_NOT_FOUND');
    }
  }

  // FROM / SELLER validation
  // payment seller is a contact
  if (input.fromType === FromToType.ENTITY) {
    try {
      entityFrom = await getRecord(TABLE_ENTITY ?? '', {
        id: input.fromId,
      });
      console.log('sellerEntity: ', entityFrom);
    } catch (err: any) {
      console.log('ERROR get entity: ', err);
      throw new Error(err.message);
    }

    if (!entityFrom) {
      throw new Error('ENTITY_FROM_NOT_FOUND');
    }
  }

  // payment seller is an entity
  else if (input.fromType === FromToType.CONTACT) {
    try {
      contactFrom = await getRecord(TABLE_CONTACT ?? '', {
        id: input.fromId,
      });
      console.log('sellerContact: ', contactFrom);
    } catch (err: any) {
      console.log('ERROR get contact: ', err);
      throw new Error(err.message);
    }

    if (!contactFrom) {
      throw new Error('CONTACT_FROM_NOT_FOUND');
    }
  }

  // SENDING a task
  if (input.direction === TaskDirection.SENDING) {
    // to validation

    if (!contactTo?.paymentUserId) {
      throw new Error('CONTACT_TO_MISSING_PAYMENT_USER_ID');
    }

    // from validation

    if (!entityFrom?.paymentUserId) {
      throw new Error('ENTITY_FROM_MISSING_PAYMENT_USER_ID');
    }

    if (input.status !== CreateTaskStatus.DRAFT) {
      if (
        entityFrom.type !== EntityType.BPAY &&
        entityFrom.verificationStatus !== VerificationStatus.PASS &&
        entityFrom.verificationStatus !== VerificationStatus.PASS_MANUAL
      ) {
        throw new Error('ENTITY_FROM_NOT_VERIFIED');
      }

      if (!entityFrom?.contact?.phone) {
        throw new Error('ENTITY_FROM_MISSING_PHONE');
      }

      if (
        input.type !== TaskType.SIGN_ONLY &&
        entityFrom.type !== EntityType.BPAY &&
        !entityFrom?.disbursementMethodId
      ) {
        throw new Error('ENTITY_FROM_MISSING_DISBURSEMENT_METHOD');
      }

      if (
        input.type !== TaskType.SIGN_ONLY &&
        !isValidABN(entityFrom?.taxNumber)
      ) {
        throw new Error('ENTITY_FROM_INVALID_ABN');
      }
    }
  }

  // RECEIVING a task
  else if (input.direction === TaskDirection.RECEIVING) {
    // to validation

    if (!entityTo?.paymentUserId) {
      throw new Error('ENTITY_TO_MISSING_PAYMENT_USER_ID');
    }

    // TODO: should we allow user to create then verify when they attempt payment? Or before creating the task? Uncomment code if #2
    //if (entityTo.verificationStatus !== VerificationStatus.PASS &&
    //  entityTo.verificationStatus !== VerificationStatus.PASS_MANUAL) {
    //  throw new Error('NO_TO_ENTITY_NOT_VERIFIED');
    //}

    // from validation

    // from is an entity
    if (
      input.fromType === FromToType.ENTITY &&
      input.type !== TaskType.SIGN_ONLY
    ) {
      //if (!entityFrom?.paymentUserId) {
      //  throw new Error('ENTITY_FROM_MISSING_OWNER_ID');
      //}

      if (input.status !== CreateTaskStatus.DRAFT) {
        // if (
        //   entityFrom.type !== EntityType.BPAY &&
        //   entityFrom.verificationStatus !== VerificationStatus.PASS &&
        //   entityFrom.verificationStatus !== VerificationStatus.PASS_MANUAL
        // ) {
        //   throw new Error('ENTITY_FROM_NOT_VERIFIED');
        // }

        //if (!entityFrom?.contact?.phone) {
        //  throw new Error('ENTITY_FROM_MISSING_PHONE');
        //}

        if (
          entityFrom.type !== EntityType.BPAY &&
          !entityFrom?.disbursementMethodId
        ) {
          throw new Error('ENTITY_FROM_MISSING_DISBURSEMENT_METHOD');
        }

        if (!isValidABN(entityFrom?.taxNumber)) {
          throw new Error('ENTITY_FROM_INVALID_ABN');
        }
      }
    }

    // from is a contact
    else if (
      input.fromType === FromToType.CONTACT &&
      input.type !== TaskType.SIGN_ONLY
    ) {
      if (!contactFrom?.paymentUserId) {
        throw new Error('CONTACT_FROM_MISSING_PAYMENT_USER_ID');
      }

      if (input.status !== CreateTaskStatus.DRAFT) {
        if (!contactFrom?.phone) {
          throw new Error('CONTACT_FROM_MISSING_PHONE');
        }

        if (
          (!contactFrom?.bank?.accountName ||
            !contactFrom?.bank?.accountNumber ||
            !contactFrom?.bank?.routingNumber) &&
          !contactFrom?.bpay?.billerCode
        ) {
          throw new Error('CONTACT_FROM_MISSING_DISBURSEMENT_METHOD');
        }

        if (!isValidABN(contactFrom?.taxNumber)) {
          throw new Error('CONTACT_FROM_INVALID_ABN');
        }
      }
    }
  }

  return {
    entityTo,
    contactTo,
    entityFrom,
    contactFrom,
  };
};
