import React, { useCallback, useRef } from 'react';
import {
  PaymentFrequency,
  TaskType,
  createTask as CREATE_TASK,
  tasksByEntityByIdContactId as TASKS_BY_ENTITY_BY_CONTACT_ID,
  updateTask as UPDATE_TASK,
  CreateTaskInput,
  TaskDirection,
  S3UploadLevel,
  S3UploadInput,
  S3UploadType,
  PaymentType,
  Task,
  selectedEntityIdInVar,
  Contact,
  Entity,
  TaskSettlementStatus,
  CreateTaskStatus,
  TaskStatus,
  UpdateTaskStatus,
  S3Upload,
} from '@admiin-com/ds-graphql';
import { FormProvider, useForm } from 'react-hook-form';
import { S3Upload as S3UploadCommon } from '@admiin-com/ds-common';

import { gql, useApolloClient, useMutation } from '@apollo/client';
import { TaskSubmitButtons } from './TaskSubmitButton';
import { TaskCreationModal } from './TaskCreationModal';
import { useNavigate } from 'react-router-dom';
import { isEntityOrContact, isVerifiedEntity } from '../../helpers/entities';
import VerificationDlg from '../VerificationDlg/VerificationDlg';
import {
  tasksByEntityFrom as TASKS_BY_ENTITY_FROM,
  tasksByEntityTo as TASKS_BY_ENTITY_TO,
  createTaskDocumentUrl as CREATE_TASK_DOCUMENT_URL,
} from '@admiin-com/ds-graphql';
import { useSnackbar } from '@admiin-com/ds-web';
import { useCurrentEntityId } from '../../hooks/useSelectedEntity/useSelectedEntity';
import { useTaskToName } from '../../hooks/useTaskToName/useTaskToName';
import AddPaymentMethodModal from '../../components/AddPaymentMethodModal/AddPaymentMethodModal';
import { ContactCreateModal } from '../ContactCreateModal/ContactCreateModal';
import { useTranslation } from 'react-i18next';

interface TaskCreationProps {
  open: boolean;
  direction?: TaskDirection;
  contact?: Contact & {
    entity?: Entity | undefined;
  };
  client?: Entity;
  from?: Entity;
  task?: Task | undefined | null;
  to?: Contact;
  handleCloseModal: () => void;
}

export type settlementStatus = 'Payable' | 'Refundable';
type PageType = 'Add' | 'Sign' | 'Summary' | 'Direction';

//TODO: is this correct for types?
// Then in your form data type
export type BillCreateFormData = {
  from: any; //TODO: types Entity or AutocompleteResult
  to: any; //TODO: types Contact or Entity
  type: TaskType;
  paymentFrequency: PaymentFrequency;
  amount: string;
  dueAt: string;
  reference: string;
  bpayReferenceNumber?: string;
  noteForSelf: string;
  paymentTypes: PaymentType;
  lodgementAt: string;
  noteForOther: string;
  documents: (S3UploadCommon | null)[];
  annotations: any;
  gstInclusive: boolean;
  numberOfPayments: number;
  settlementStatus?: TaskSettlementStatus | null;
  paymentAt: string;
  firstPaymentAt: string;
};

export const BillCreationContext = React.createContext<any>(null);

export function TaskCreation({
  open,
  handleCloseModal,
  direction,
  contact,
  to,
  client,
  task,
  from,
}: TaskCreationProps) {
  const [page, setPage] = React.useState<PageType>(
    direction ? 'Add' : 'Direction'
  );
  const [taskDirection, setTaskDirection] = React.useState<
    TaskDirection | undefined
  >(direction);
  const pdfSignatureRef = useRef(null);
  const [showUpload, setShowUpload] = React.useState<boolean>(false);
  const [showSignFields, setShowSignFields] = React.useState<boolean>(false);
  const [prevPage, setPrevPage] = React.useState<PageType | null>(null);
  const [recevingAccountModal, setRecevingAccountModal] =
    React.useState<boolean>(false);

  const methods = useForm<BillCreateFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      documents: [],
    },
  });

  const taskProp = task;
  const getTaskName = useTaskToName();
  const setFromTo = async () => {
    const { data: to } = await getTaskName(task?.toId, true);
    const { data: from } = await getTaskName(task?.fromId, true);
    if (to && from) {
      methods.setValue('to', to);
      methods.setValue('from', from);
    }
  };

  const setDocuments = async () => {
    if (taskProp && taskProp.documents && taskProp.documents.length > 0) {
      const documentUrlData = await createTaskDocumentUrl({
        variables: {
          input: {
            taskId: taskProp.id,
            entityId: taskProp.entityId,
          },
        },
      });
      const url = documentUrlData?.data?.createTaskDocumentUrl?.url;
      if (url)
        methods.setValue(
          'documents',
          taskProp.documents.map(
            (document: S3Upload | null): S3UploadCommon | null => ({
              identityId: document?.identityId,
              key: document?.key ?? '',
              src: url,
              level: document?.level as S3UploadLevel,
              type: document?.type as S3UploadType,
            })
          )
        );
    }
  };
  const [createTaskDocumentUrl] = useMutation(gql(CREATE_TASK_DOCUMENT_URL));

  React.useEffect(() => {
    if (taskProp) {
      if (taskProp.direction) setTaskDirection(taskProp.direction);
      if (taskProp.status)
        setPage(taskProp.status === TaskStatus.DRAFT ? 'Add' : 'Summary');
      setShowUpload(false);
      setShowSignFields(false);
      setPrevPage(null);
      if (taskProp.type) methods.setValue('type', taskProp?.type);
      if (taskProp.amount)
        methods.setValue('amount', taskProp.amount.toString());
      if (taskProp.dueAt) methods.setValue('dueAt', taskProp.dueAt);
      if (taskProp.reference) methods.setValue('reference', taskProp.reference);
      setFromTo();
      if (taskProp.bpayReferenceNumber)
        methods.setValue('bpayReferenceNumber', taskProp.bpayReferenceNumber);
      if (taskProp.noteForSelf)
        methods.setValue('noteForSelf', taskProp.noteForSelf);
      if (taskProp.lodgementAt)
        methods.setValue('lodgementAt', taskProp.lodgementAt);
      if (taskProp.noteForOther)
        methods.setValue('noteForOther', taskProp.noteForOther);
      if (taskProp.paymentFrequency)
        methods.setValue('paymentFrequency', taskProp.paymentFrequency);
      if (taskProp.numberOfPayments)
        methods.setValue('numberOfPayments', taskProp.numberOfPayments);
      if (taskProp.paymentAt) methods.setValue('paymentAt', taskProp.paymentAt);
      setDocuments();
      if (taskProp.annotations)
        methods.setValue('annotations', taskProp.annotations);
      if (taskProp.settlementStatus)
        methods.setValue('settlementStatus', taskProp.settlementStatus);
    }
  }, [taskProp, open]);
  const { t } = useTranslation();

  React.useEffect(() => {
    if (contact) {
      if (taskDirection === TaskDirection.RECEIVING) {
        methods.setValue('from', contact);
      } else if (taskDirection === TaskDirection.SENDING) {
        methods.setValue('to', contact);
      }
    }
    if (client) {
      if (taskDirection === TaskDirection.RECEIVING) {
        methods.setValue('to', client);
      } else if (taskDirection === TaskDirection.SENDING) {
        methods.setValue('from', client);
      }
    }
  }, [taskDirection]);

  React.useEffect(() => {
    if (from) {
      methods.setValue('from', from);
    }
  }, [from]);
  React.useEffect(() => {
    if (to) {
      methods.setValue('to', to);
    }
  }, [to]);

  const [saved, setSaved] = React.useState<boolean>(false);
  const [submitted, setSubmitted] = React.useState<boolean>(false);
  const handleSetPage = React.useCallback((newPage: PageType) => {
    const type = methods.watch('type');
    let prevPage: null | PageType;
    switch (newPage) {
      case 'Direction':
        prevPage = null;
        break;
      case 'Add':
        prevPage = 'Direction';
        break;
      case 'Summary':
        if (type === 'SIGN_ONLY' || type === 'SIGN_PAY') prevPage = 'Sign';
        else prevPage = 'Add';
        break;
      case 'Sign':
        prevPage = 'Add';
        break;
    }
    setPrevPage(prevPage);
    setPage(newPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = React.useCallback(() => {
    handleCloseModal();
    setSaved(false);
    setSubmitted(false);
    setPage('Direction');
  }, []);

  const [loading, setLoading] = React.useState(false);
  const [draftLoading, setDraftLoading] = React.useState(false);
  const [createTask] = useMutation(gql(CREATE_TASK));
  const [updateTask] = useMutation(gql(UPDATE_TASK));
  const navigate = useNavigate();
  const [createError, setCreateError] = React.useState<any>(null);
  const apolloClient = useApolloClient();

  const [openVerificationModal, setOpenVerificationModal] =
    React.useState<boolean>(false);
  const [entityToBeVerified, setEntityToBeVerified] = React.useState<
    Entity | undefined
  >();

  const currentEntityId = useCurrentEntityId();
  const [verified, setVerified] = React.useState(false);
  const [updatingContact, setUpdatingContact] = React.useState<
    Contact | undefined
  >(undefined);
  const [openContactModal, setOpenContactModal] =
    React.useState<boolean>(false);

  const handleClosContactModal = () => {
    setOpenContactModal(false);
    setUpdatingContact(undefined);
  };

  const createTaskWithDraft = async (isDraft = false) => {
    if (!taskDirection) return;
    const values = methods.watch();
    setEntityToBeVerified(values.from);

    if (!isDraft && !verified) {
      // if (taskDirection === TaskDirection.RECEIVING) {
      //   if (values.to && !isVerifiedEntity(values.to)) {
      //     setOpenVerificationModal(true);
      //     setEntityToBeVerified(values.to);
      //     throw new Error('ENTITY_NOT_VERIFIED');
      //   }
      // } else
      if (taskDirection === TaskDirection.SENDING) {
        if (values.from && !isVerifiedEntity(values.from)) {
          setOpenVerificationModal(true);
          throw new Error('ENTITY_NOT_VERIFIED');
        }
      }
    }

    const documents: S3UploadInput[] = [];

    values?.documents.forEach((document: S3UploadCommon | null) => {
      if (document)
        documents.push({
          level: document.level as S3UploadLevel,
          key: document.key,
          identityId: document.identityId,
          type: document.type as S3UploadType,
        });
    });

    const isTax = values.from?.metadata?.subCategory === 'TAX';

    let dueAt;
    if (isTax) {
      dueAt = values.paymentAt || values.lodgementAt;
    } else if (values.paymentFrequency !== PaymentFrequency.ONCE) {
      dueAt = values.firstPaymentAt;
    } else {
      dueAt = values.dueAt;
    }

    const payableInfo = {
      amount: Math.round(Number(values.amount) * 100),
      paymentFrequency:
        values.type === TaskType.SIGN_ONLY
          ? undefined
          : values.paymentFrequency,
      gstInclusive: values.gstInclusive,
      // gstAmount: values.gstInclusive
      //   ? Math.round((Number(values.amount) * 100) / GST_RATE)
      //   : 0,
      paymentTypes: [
        PaymentType.PAY_NOW,
        PaymentType.SCHEDULED,
        ...(values.paymentTypes === PaymentType.INSTALLMENTS || isTax
          ? [PaymentType.INSTALLMENTS]
          : []),
      ],
      paymentAt: values.paymentAt === '' ? undefined : values.paymentAt,
    };
    const signableInfo = {
      documents,
      annotations: values.annotations ? values.annotations : null,
    };
    const taxInfo = {
      lodgementAt: values.lodgementAt === '' ? undefined : values.lodgementAt,
      settlementStatus: isTax ? values.settlementStatus : undefined,
    };
    const payable = values.type !== TaskType.SIGN_ONLY;
    const signable = values.type !== TaskType.PAY_ONLY;
    const task: CreateTaskInput = {
      fromId: values.from?.id,
      fromType: isEntityOrContact(values.from),
      toId: values.to?.id,
      toType: isEntityOrContact(values.to),
      type: values.type ?? TaskType.SIGN_PAY,
      reference: values.reference,
      bpayReferenceNumber: values.bpayReferenceNumber ?? null,
      noteForSelf: values.noteForSelf ?? '',
      noteForOther: values.noteForOther ?? '',
      direction: taskDirection,
      dueAt,
      ...(isTax ? taxInfo : {}),
      ...(payable ? payableInfo : {}),
      ...(signable ? signableInfo : {}),
      paymentTypes: payable ? payableInfo.paymentTypes : [],
      documents: signableInfo.documents,
    };

    if (values.paymentFrequency !== PaymentFrequency.ONCE) {
      task.numberOfPayments = values.numberOfPayments;
    } else {
      task.numberOfPayments = 1;
    }

    if (isDraft) {
      task.status = CreateTaskStatus.DRAFT;
      // if (!task.amount) task.amount = 100;
    }
    let createdTaskData;
    if (taskProp)
      createdTaskData = await updateTask({
        variables: {
          input: {
            id: taskProp.id,
            ...task,
            entityId: currentEntityId,
            status: isDraft
              ? CreateTaskStatus.DRAFT
              : UpdateTaskStatus.INCOMPLETE,
          },
        },
      });
    else
      createdTaskData = await createTask({
        variables: {
          input: { ...task },
        },
        update: (cache, { data: { createTask } }) => {
          const variables = {
            entityId: createTask.fromId,
            status:
              createTask?.status === 'DRAFT'
                ? 'INCOMPLETE'
                : createTask?.status,
            limit: 20,
          };

          // Update tasksByEntityFrom if direction is SENDING
          if (task.direction === TaskDirection.SENDING) {
            const existingData: any = cache.readQuery({
              query: gql(TASKS_BY_ENTITY_FROM),
              variables,
            });

            if (existingData) {
              cache.writeQuery({
                query: gql(TASKS_BY_ENTITY_FROM),
                variables,
                data: {
                  tasksByEntityFrom: {
                    ...existingData.tasksByEntityFrom,
                    items: [
                      createTask,
                      ...existingData.tasksByEntityFrom.items,
                    ],
                  },
                },
              });
            }
          }

          // Update tasksByEntityTo if direction is RECEIVING
          if (task.direction === TaskDirection.RECEIVING) {
            variables.entityId = createTask.toId;
            const existingData: any = cache.readQuery({
              query: gql(TASKS_BY_ENTITY_TO),
              variables,
            });

            if (existingData) {
              cache.writeQuery({
                query: gql(TASKS_BY_ENTITY_TO),
                variables,
                data: {
                  tasksByEntityTo: {
                    ...existingData.tasksByEntityTo,
                    items: [createTask, ...existingData.tasksByEntityTo.items],
                  },
                },
              });
            }
          }

          if (createTask.contactId) {
            const existingData: any = cache.readQuery({
              query: gql(TASKS_BY_ENTITY_BY_CONTACT_ID),
              variables: {
                contactId: createTask.contactId,
                entityIdBy: createTask.entityIdBy,
              },
            });
            if (existingData) {
              cache.writeQuery({
                query: gql(TASKS_BY_ENTITY_BY_CONTACT_ID),
                variables: {
                  contactId: createTask.contactId,
                  entityIdBy: createTask.entityIdBy,
                },
                data: {
                  tasksByEntityByIdContactId: {
                    ...existingData.tasksByEntityByIdContactId,
                    items: [
                      createTask,
                      ...existingData.tasksByEntityByIdContactId.items,
                    ],
                  },
                },
              });
            }
          }
        },
        awaitRefetchQueries: true,
      });

    const createdTask = createdTaskData?.data?.createTask;
    return createdTask;
  };

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const createdTask = await createTaskWithDraft(false);
      setSubmitted(true);
      setTimeout(() => {
        handleClose();
        selectCreateTask(createdTask);
      }, 2500);
    } catch (err: any) {
      console.log('error creating draft task: ', err);
      if (err.message !== 'ENTITY_NOT_VERIFIED') {
        if (err.message === 'ENTITY_FROM_MISSING_DISBURSEMENT_METHOD') {
          setRecevingAccountModal(true);
          throw new Error('RECEIVING_ACCOUNT_NOT_EXIST');
        } else if (err.message === 'CONTACT_FROM_MISSING_DISBURSEMENT_METHOD') {
          setUpdatingContact(methods.watch().from);
          setOpenContactModal(true);
          showSnackbar({
            message: t('contactFromMissingDisbursementMethod', {
              ns: 'contacts',
            }),
            severity: 'warning',
            horizontal: 'right',
            vertical: 'bottom',
          });
        } else setCreateError(err);
      }
      console.log('error updating entity: ', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createTask, handleClose, taskDirection, verified, methods]);
  const showSnackbar = useSnackbar();
  const handleSave = useCallback(async () => {
    // Hanlde create task with status of draft here and do not validate in this function
    if (draftLoading) return;
    if (!(await methods.trigger('from')) || !(await methods.trigger('to')))
      return;
    try {
      setDraftLoading(true);
      const createdTask = await createTaskWithDraft(true);
      setSaved(true);
      setTimeout(() => {
        handleClose();
        selectCreateTask(createdTask);
      }, 2500);
      setDraftLoading(false);
    } catch (err: any) {
      console.log('error updating entity: ', err);
      // setCreateError(err);
      showSnackbar({
        message: err?.message,
        severity: 'error',
        horizontal: 'right',
        vertical: 'bottom',
      });
      setDraftLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftLoading, taskDirection, verified, methods]);
  const selectCreateTask = (createdTask: Task) => {
    if (client) return;
    selectedEntityIdInVar(createdTask.entityId);
    apolloClient.cache.evict({ fieldName: 'selectedEntityId' });
    apolloClient.cache.gc();
    localStorage.setItem('selectedEntityId', createdTask.entityId);
    navigate(
      `/taskbox/${createdTask?.id ?? ''}?direction=${
        createdTask.direction
      }&status=Due`
    );
  };

  return (
    <BillCreationContext.Provider
      value={{
        pdfSignatureRef,
        saved,
        setPage: handleSetPage,
        client,
        handleSave,
        showUpload,
        showSignFields,
        loading,
        submitted,
        prevPage,
        page,
        open,
        handleClose,
        task: taskProp,
        createError,
        taskDirection,
        setTaskDirection,
        setShowUpload,
        setShowSignFields,
        handleSubmit,
      }}
    >
      <FormProvider {...methods}>
        <TaskCreationModal />
      </FormProvider>
      {entityToBeVerified ? (
        <VerificationDlg
          entity={entityToBeVerified}
          onSuccess={() => {
            console.log('success');
            setVerified(true);
          }}
          open={openVerificationModal}
          onClose={() => setOpenVerificationModal(false)}
        />
      ) : null}
      <AddPaymentMethodModal
        open={recevingAccountModal}
        type="ReceivingAccount"
        entityId={entityToBeVerified?.id}
        handleClose={() => setRecevingAccountModal(false)}
      />
      <ContactCreateModal
        entityId={updatingContact?.entityId}
        selected={updatingContact}
        onSuccess={() => {
          setTimeout(() => {
            handleClosContactModal();
          }, 1000);
        }}
        handleCloseModal={handleClosContactModal}
        open={openContactModal}
      />
    </BillCreationContext.Provider>
  );
}

TaskCreation.SubmitButtons = React.memo(TaskSubmitButtons);
TaskCreation.Modal = React.memo(TaskCreationModal);

export const useTaskCreationContext = () => {
  const context = React.useContext(BillCreationContext);
  return context;
};
