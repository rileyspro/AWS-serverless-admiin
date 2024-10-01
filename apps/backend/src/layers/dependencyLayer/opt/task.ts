import {
  CreateTaskStatus,
  EntityUser,
  Task,
  TaskPaymentStatus,
  TaskSettlementStatus,
  TaskSignatureStatus,
  TaskStatus,
  TaskType,
  UpdateTaskPaymentStatus,
  UpdateTaskStatus,
} from 'dependency-layer/API';
import { getRecord } from 'dependency-layer/dynamoDB';
import { sendEmail } from 'dependency-layer/pinpoint';
import { DateTime } from 'luxon';

export interface Annotation {
  id: string;
  bbox: number[];
  borderWidth?: number; //TODO: optional?
  contentType?: string;
  createdAt: string;
  customData: {
    label: string;
    status: string;
    type: string;
    userId?: string;
    entityId?: string;
    contactId?: string;
    signerType: 'ENTITY_USER' | 'CONTACT';
  };
  flags: string[];
  imageAttachmentId?: string;
  name: string;
  opacity: number;
  pageIndex: number;
  rotation: number;
  type: string;
  updatedAt: string;
  v: number;
  font?: string;
  fontColor?: string;
  fontSize?: number;
  horizontalAlign?: string;
  isFitting?: boolean;
  lineHeightFactor?: number;
  text?: {
    format: string;
    value: string;
  };
  verticalAlign?: string;
}

export interface Attachment {
  binary: string;
  contentType: string;
}

export interface AnnotationDocument {
  annotations: Annotation[];
  attachments: {
    [key: string]: Attachment;
  };
  format: string;
  pdfId: string | null;
}

export const isDocumentSigned = (
  annotations?: AnnotationDocument | null
): boolean => {
  if (!annotations || !annotations?.annotations) {
    return true;
  }

  return annotations?.annotations?.every(
    (annotation) =>
      !annotation?.customData?.status ||
      annotation.customData.status === 'ACTIONED'
  );
};
export const isTaskNewSignature = (
  oldAnnotations?: AnnotationDocument | null,
  newAnnotations?: AnnotationDocument | null
): boolean => {
  if (!oldAnnotations || !oldAnnotations?.annotations) {
    return true;
  }

  if (!newAnnotations || !newAnnotations?.annotations) {
    return false;
  }

  return oldAnnotations.annotations.every((oldAnnotation) => {
    if (oldAnnotation.customData?.type === 'SIGNATURE') {
      const newAnnotation = newAnnotations.annotations.find(
        (annotation) => annotation.id === oldAnnotation.id
      );

      return (
        newAnnotation &&
        newAnnotation.customData?.status === 'ACTIONED' &&
        oldAnnotation.customData?.status !== 'ACTIONED'
      );
    }

    return true;
  });
};
export const getUpdatedAnnotations = ({
  oldAnnotations,
  newAnnotations,
}: {
  oldAnnotations?: AnnotationDocument | null;
  newAnnotations?: AnnotationDocument | null;
}): Annotation[] => {
  const updatedAnnotations: Annotation[] = [];

  if (!oldAnnotations?.annotations || !newAnnotations?.annotations) {
    return updatedAnnotations;
  }

  oldAnnotations.annotations.forEach((oldAnnotation) => {
    if (oldAnnotation.customData?.type === 'SIGNATURE') {
      const newAnnotation = newAnnotations.annotations.find(
        (annotation) => annotation.id === oldAnnotation.id
      );

      if (
        newAnnotation &&
        newAnnotation.customData?.status === 'ACTIONED' &&
        oldAnnotation.customData?.status !== 'ACTIONED'
      ) {
        updatedAnnotations.push(newAnnotation);
      }
    }
  });

  return updatedAnnotations;
};
export const getUnactionedAnnotations = ({
  newAnnotations,
}: {
  newAnnotations?: AnnotationDocument | null;
}): Annotation[] => {
  const updatedAnnotations: Annotation[] = [];

  if (!newAnnotations?.annotations) {
    return updatedAnnotations;
  }

  newAnnotations.annotations.forEach((newAnnotation) => {
    if (
      newAnnotation.customData?.type === 'SIGNATURE' &&
      newAnnotation.customData?.status !== 'ACTIONED'
    ) {
      updatedAnnotations.push(newAnnotation);
    }
  });

  return updatedAnnotations;
};
export const getCreatedAnnotations = ({
  newAnnotations,
}: {
  newAnnotations?: AnnotationDocument | null;
}): Annotation[] => {
  const updatedAnnotations: Annotation[] = [];

  if (!newAnnotations?.annotations) {
    return updatedAnnotations;
  }

  newAnnotations.annotations.forEach((newAnnotation) => {
    if (
      newAnnotation.customData?.type === 'SIGNATURE' &&
      newAnnotation.customData?.status === 'ACTIONED'
    ) {
      updatedAnnotations.push(newAnnotation);
    }
  });

  return updatedAnnotations;
};
export const getTaskSignatureStatus = ({
  type,
  annotations,
}: {
  type?: TaskType | null;
  annotations?: AnnotationDocument | null;
}): TaskSignatureStatus => {
  if (type === TaskType.SIGN_PAY || type === TaskType.SIGN_ONLY) {
    return isDocumentSigned(annotations)
      ? TaskSignatureStatus.SIGNED
      : TaskSignatureStatus.PENDING_SIGNATURE;
  }

  return TaskSignatureStatus.NOT_SIGNABLE;
};
export const getTaskPaymentStatus = ({
  updatedPaymentStatus,
  type,
  existingStatus,
  settlementStatus,
}: {
  updatedPaymentStatus?: UpdateTaskPaymentStatus;
  type?: TaskType | null;
  updateType?: TaskType | null;
  settlementStatus?: string | null;
  existingStatus?: TaskPaymentStatus | null;
}): TaskPaymentStatus => {
  if (
    existingStatus === TaskPaymentStatus.PAID ||
    existingStatus === TaskPaymentStatus.PENDING_TRANSFER ||
    existingStatus === TaskPaymentStatus.SCHEDULED ||
    existingStatus === TaskPaymentStatus.NOT_PAYABLE
  ) {
    return existingStatus;
  }

  if (
    updatedPaymentStatus &&
    updatedPaymentStatus === UpdateTaskPaymentStatus.MARKED_AS_PAID
  ) {
    return TaskPaymentStatus.MARKED_AS_PAID;
  }

  if (
    updatedPaymentStatus &&
    updatedPaymentStatus === UpdateTaskPaymentStatus.PENDING_PAYMENT
  ) {
    return TaskPaymentStatus.PENDING_PAYMENT;
  }

  if (settlementStatus === TaskSettlementStatus.REFUNDABLE) {
    return TaskPaymentStatus.NOT_PAYABLE;
  }

  if (type === TaskType.SIGN_PAY || type === TaskType.PAY_ONLY) {
    return TaskPaymentStatus.PENDING_PAYMENT;
  }

  return TaskPaymentStatus.NOT_PAYABLE;
};
export const TASK_PAID_STATUSES = [
  TaskPaymentStatus.MARKED_AS_PAID,
  TaskPaymentStatus.PAID,
  TaskPaymentStatus.NOT_PAYABLE,
];
export const TASK_SIGNED_STATUSES = [
  TaskSignatureStatus.SIGNED,
  TaskSignatureStatus.NOT_SIGNABLE,
];
export const getTaskStatus = ({
  status,
  signatureStatus,
  paymentStatus,
}: {
  status?: CreateTaskStatus | UpdateTaskStatus | null;
  signatureStatus?: TaskSignatureStatus | null;
  paymentStatus: TaskPaymentStatus;
}) => {
  if (status === CreateTaskStatus.DRAFT) {
    return TaskStatus.DRAFT;
  }

  if (status === UpdateTaskStatus.ARCHIVED) {
    return TaskStatus.ARCHIVED;
  }

  if (
    paymentStatus &&
    TASK_PAID_STATUSES.includes(paymentStatus) &&
    signatureStatus &&
    TASK_SIGNED_STATUSES.includes(signatureStatus)
  ) {
    return TaskStatus.COMPLETED;
  }

  if (
    signatureStatus === TaskSignatureStatus.PENDING_SIGNATURE ||
    paymentStatus === TaskPaymentStatus.PENDING_PAYMENT
  ) {
    return TaskStatus.INCOMPLETE;
  }

  return TaskStatus.SCHEDULED;
};
export const getTaskSearchStatus = ({
  status,
  signatureStatus,
  paymentStatus,
}: {
  status?: TaskStatus | null;
  signatureStatus?: TaskSignatureStatus | null;
  paymentStatus: TaskPaymentStatus;
}) => {
  if (status === TaskStatus.DRAFT) {
    return TaskStatus.INCOMPLETE;
  }

  if (status === TaskStatus.ARCHIVED) {
    return TaskStatus.ARCHIVED;
  }

  if (
    paymentStatus &&
    TASK_PAID_STATUSES.includes(paymentStatus) &&
    signatureStatus &&
    TASK_SIGNED_STATUSES.includes(signatureStatus)
  ) {
    return TaskStatus.COMPLETED;
  }

  if (
    signatureStatus === TaskSignatureStatus.PENDING_SIGNATURE ||
    paymentStatus === TaskPaymentStatus.PENDING_PAYMENT
  ) {
    return TaskStatus.INCOMPLETE;
  }

  return TaskStatus.SCHEDULED;
};

export async function sendSignatureEmail(
  task: Task,
  templateName: 'signature' | 'signature-reminder' | 'signature-overdue'
) {
  const {
    TABLE_ENTITY,
    TABLE_ENTITY_USER,
    TABLE_USER,
    TABLE_CONTACT,
    FROM_EMAIL,
    WEB_DOMAIN,
  } = process.env;

  // send email to signers
  const toData: { userId: string; email: string; firstName: string }[] = [];
  const signers = getUnactionedAnnotations({
    newAnnotations: task.annotations as AnnotationDocument | null | undefined,
  });

  console.log('Signers: ', signers);

  const sellerEntity = await getRecord(TABLE_ENTITY ?? '', { id: task.fromId });

  for (let i = 0; i < signers.length; i++) {
    if (
      signers[i]?.customData?.signerType === 'ENTITY_USER' &&
      signers[i]?.customData?.userId !== task.createdBy
    ) {
      let entityUser: EntityUser | undefined;
      try {
        entityUser = await getRecord(TABLE_ENTITY_USER ?? '', {
          entityId: signers[i].customData.entityId,
          userId: signers[i].customData.userId,
        });
      } catch (err) {
        console.log('ERROR get entity user: ', err);
      }

      if (entityUser) {
        let user;
        try {
          user = await getRecord(TABLE_USER ?? '', { id: entityUser.userId });
          toData.push({
            userId: entityUser.userId,
            email: user.email,
            firstName: entityUser.firstName ?? '',
          });
        } catch (err) {
          console.log('ERROR get user: ', err);
        }
      }
    }

    if (signers[i]?.customData?.signerType === 'CONTACT') {
      const contact = await getRecord(TABLE_CONTACT ?? '', {
        id: signers[i].customData.contactId,
      });

      if (contact) {
        toData.push({
          userId: contact?.userId,
          email: contact?.email,
          firstName: contact?.firstName,
        });
      }
    }
  }

  const requests = [];
  for (let i = 0; i < toData.length; i++) {
    const templateData = {
      task: {
        ...task,
        from: sellerEntity?.legalName ?? '',
        url: `${WEB_DOMAIN}/guest/pay-task?entityId=${task.entityId}&taskId=${task.id}`,
        dueAtFormatted: DateTime.fromISO(task.dueAt).toLocaleString(
          DateTime.DATE_HUGE
        ),
      },
      template: {
        title: `Signature requested from ${sellerEntity?.legalName}`,
        preheader: `Your signature has been requested from ${sellerEntity?.legalName}`,
      },
      user: {
        firstName: toData[i].firstName ?? '',
      },
    };

    const emailParams = {
      senderAddress: FROM_EMAIL ?? '',
      toAddresses: [toData[i].email],
      templateName,
      templateData,
    };

    console.log('emailParams: ', emailParams);

    requests.push(sendEmail(emailParams));
  }

  try {
    const response = await Promise.all(requests);
    console.log('response: ', response);
  } catch (err) {
    console.log('ERROR send signature required email: ', err);
  }
}
