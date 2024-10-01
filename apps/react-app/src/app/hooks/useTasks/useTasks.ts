import {
  CSGetSelectedEntityId as GET_SELECTED_ENTITY_ID,
  Task,
  TaskDirection,
  TaskPaymentStatus,
  tasksByEntityFrom as TASKS_BY_ENTITY_FROM,
  tasksByEntityTo as TASKS_BY_ENTITY_TO,
  TaskSignatureStatus,
  TaskStatus,
  TaskType,
} from '@admiin-com/ds-graphql';
import { gql, useLazyQuery, useQuery } from '@apollo/client';
import React, { useLayoutEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTaskDueDate, isDeclinedTask } from '../../helpers/tasks';
import { mergeUniqueItems } from '@admiin-com/ds-common';
import { hasOverDueInstallmentForSent } from '../../helpers/payments';

type SubFilter = 'Due' | 'Scheduled' | 'Completed' | 'Draft';

interface useTasksProps {
  direction?: TaskDirection;
  isCompleted?: 'COMPLETED' | 'INCOMPLETE';
  limit?: number;
  entityId?: string;
  syncUrl?: boolean;
  polling?: number;
  skipPolling?: () => boolean;
}

export const useTasks = (props?: useTasksProps) => {
  const {
    direction,
    syncUrl,
    isCompleted,
    polling = 0,
    limit,
    entityId: entityIdProps,
  } = props ?? {};
  const { data: selectedEntityIdData } = useQuery(gql(GET_SELECTED_ENTITY_ID));

  const [searchParams, setSearchParams] = useSearchParams();

  const urlDirection = searchParams.get('direction');
  const urlStatus = searchParams.get('status');

  const [directionFilter, setDirectionFilter] = React.useState<TaskDirection>(
    direction ?? ((urlDirection as TaskDirection) || TaskDirection.RECEIVING)
  );

  const [statusFilter, setStatusFilter] = React.useState<SubFilter>(
    (urlStatus as SubFilter) || 'Due'
  );

  const [searchTerm, setSearchTerm] = React.useState<string>('');

  React.useEffect(() => {
    if (direction) setDirectionFilter(direction);
  }, [direction]);

  React.useEffect(() => {
    if (urlDirection && syncUrl && urlDirection !== directionFilter)
      setDirectionFilter(urlDirection as TaskDirection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlDirection]);

  React.useEffect(() => {
    if (urlStatus && syncUrl && urlStatus !== statusFilter)
      setStatusFilter(urlStatus as SubFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlStatus]);

  const completedStatus =
    isCompleted || (statusFilter === 'Completed' ? 'COMPLETED' : 'INCOMPLETE');

  const entityId =
    entityIdProps || selectedEntityIdData?.selectedEntityId || '';

  React.useEffect(() => {
    syncUrl &&
      setSearchParams({ direction: directionFilter, status: statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directionFilter, statusFilter]);

  const [
    tasksByEntityFrom,
    {
      fetchMore: fetchMoreFrom,
      data: tasksByEntityFromData,
      error: tasksFromErrors,
      loading: tasksFromLoading,
    },
  ] = useLazyQuery(gql(TASKS_BY_ENTITY_FROM), {
    notifyOnNetworkStatusChange: true,
  });

  const [
    tasksByEntityTo,
    {
      fetchMore: fetchMoreTo,
      data: tasksByEntityToData,
      error: tasksToErrors,
      loading: tasksToLoading,
    },
  ] = useLazyQuery(gql(TASKS_BY_ENTITY_TO), {
    notifyOnNetworkStatusChange: true,
  });

  const loadingData = tasksFromLoading || tasksToLoading;
  const tasksByEntityData = useMemo(
    () =>
      directionFilter === 'RECEIVING'
        ? tasksByEntityToData
        : tasksByEntityFromData,
    [directionFilter, tasksByEntityToData, tasksByEntityFromData]
  );

  const tasksFrom = useMemo(() => {
    const data =
      tasksByEntityFromData?.tasksByEntityFrom?.items.filter(
        (task: Task) => task.status !== TaskStatus.ARCHIVED
      ) || [];
    return data;
  }, [tasksByEntityFromData]);

  const tasksTo = useMemo(() => {
    return (
      tasksByEntityToData?.tasksByEntityTo?.items.filter(
        (task: Task) => task.status !== TaskStatus.ARCHIVED
      ) || []
    );
  }, [tasksByEntityToData]);

  const hasNextPageFrom =
    tasksByEntityFromData?.tasksByEntityFrom?.nextToken != null;
  const hasNextPageTo = tasksByEntityToData?.tasksByEntityTo?.nextToken != null;
  const hasNextPage =
    directionFilter === TaskDirection.RECEIVING
      ? hasNextPageTo
      : hasNextPageFrom;

  const tasks = useMemo(
    () =>
      (directionFilter === TaskDirection.RECEIVING ? tasksTo : tasksFrom).map(
        (task: Task) => ({ ...task, amount: (task.amount ?? 0) / 100 })
      ),
    [directionFilter, tasksFrom, tasksTo]
  );
  const handleLoadMore = React.useCallback(() => {
    const nextToken =
      directionFilter === TaskDirection.RECEIVING
        ? tasksByEntityToData?.tasksByEntityTo?.nextToken
        : tasksByEntityFromData?.tasksByEntityFrom?.nextToken;

    if (nextToken) {
      const fetchMore =
        directionFilter === TaskDirection.RECEIVING
          ? fetchMoreTo
          : fetchMoreFrom;
      fetchMore({
        variables: {
          nextToken: nextToken,
        },
        updateQuery: (prevResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prevResult;
          if (directionFilter === TaskDirection.RECEIVING)
            return {
              ...fetchMoreResult,
              tasksByEntityTo: {
                ...fetchMoreResult.tasksByEntityTo,
                items: mergeUniqueItems(
                  prevResult.tasksByEntityTo?.items ?? [],
                  fetchMoreResult.tasksByEntityTo?.items ?? [],
                  ['id'] // Assuming 'id' is the unique key
                ),
                nextToken: fetchMoreResult.tasksByEntityTo.nextToken, // Ensure the new token is updated
              },
            };
          else
            return {
              ...fetchMoreResult,
              tasksByEntityFrom: {
                ...fetchMoreResult.tasksByEntityFrom,
                items: mergeUniqueItems(
                  prevResult.tasksByEntityFrom?.items ?? [],
                  fetchMoreResult.tasksByEntityFrom?.items ?? [],
                  ['id'] // Assuming 'id' is the unique key
                ),
                nextToken: fetchMoreResult.tasksByEntityFrom.nextToken, // Ensure the new token is updated
              },
            };
        },
      });
    }
  }, [
    directionFilter,
    fetchMoreFrom,
    fetchMoreTo,
    tasksByEntityFromData?.tasksByEntityFrom?.nextToken,
    tasksByEntityToData?.tasksByEntityTo?.nextToken,
  ]);

  React.useEffect(() => {
    if (
      hasNextPage &&
      handleLoadMore &&
      tasksByEntityData?.length === 0 &&
      !loadingData
    ) {
      handleLoadMore();
    }
  }, [hasNextPage, loadingData, tasksByEntityData]);

  useLayoutEffect(() => {
    const listTasks = async () => {
      try {
        if (directionFilter === TaskDirection.RECEIVING)
          await tasksByEntityTo({
            variables: {
              entityId,
              status: completedStatus,
              limit: limit ?? 20,
            },
          });
        if (directionFilter === TaskDirection.SENDING)
          await tasksByEntityFrom({
            variables: {
              entityId,
              status: completedStatus,
              limit: limit ?? 20,
            },
          });
      } catch (err) {
        console.log('ERROR listing entities: ', err);
      }
    };
    if (entityId) listTasks();
  }, [
    directionFilter,
    entityId,
    completedStatus,
    tasksByEntityFrom,
    tasksByEntityTo,
    limit,
    searchTerm,
  ]);
  const dueAndScheduled = React.useMemo(
    () =>
      // tasks.filter(
      //   (task: Task) =>
      //     task &&
      //     (task.status === TaskStatus.DRAFT ||
      //       task.paymentStatus === TaskPaymentStatus.MARKED_AS_PAID ||
      //       task.paymentStatus === TaskPaymentStatus.PENDING_PAYMENT ||
      //       task.paymentStatus === TaskPaymentStatus.SCHEDULED ||
      //       task.paymentStatus ===
      //         TaskPaymentStatus.PENDING_PAYTO_AGREEMENT_CREATION ||
      //       task.paymentStatus === TaskPaymentStatus.NOT_PAYABLE ||
      //       task.paymentStatus === TaskPaymentStatus.PENDING_PAYID_TRANSFER ||
      //       task.signatureStatus === TaskSignatureStatus.PENDING_SIGNATURE)
      // ),
      tasks,
    [tasks]
  );
  const dueTasks = React.useMemo(
    () =>
      dueAndScheduled.filter(
        (task: Task) =>
          task && !(task.paymentStatus === TaskPaymentStatus.SCHEDULED)
      ),
    [dueAndScheduled]
  );
  const scheduledTasks = React.useMemo(
    () =>
      dueAndScheduled.filter(
        (task: Task) =>
          task && task.paymentStatus === TaskPaymentStatus.SCHEDULED
      ),
    [dueAndScheduled]
  );
  const filterdTasksByStatus = React.useMemo(() => {
    if (statusFilter === 'Due') {
      return dueTasks;
    } else if (statusFilter === 'Scheduled') {
      return scheduledTasks;
    } else if (statusFilter === 'Completed') {
      return tasks.filter(
        (task: Task) =>
          task &&
          (task.paymentStatus === TaskPaymentStatus.PAID ||
            task.status === TaskStatus.COMPLETED)
      );
    } else if (statusFilter === 'Draft') {
      return tasks.filter(
        (task: Task) => task && task.status === TaskStatus.DRAFT
      );
    }
  }, [statusFilter, tasks]);

  const tasksData = {
    tasks: filterdTasksByStatus,
    error:
      directionFilter === TaskDirection.RECEIVING
        ? tasksToErrors
        : tasksFromErrors,
    loading:
      directionFilter === TaskDirection.RECEIVING
        ? tasksToLoading
        : tasksFromLoading,
  };

  const hasDeclinedPayment = scheduledTasks.find(
    (task: Task) => isDeclinedTask(task) || hasOverDueInstallmentForSent(task)
  );

  const onSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  return {
    directionFilter,
    setDirectionFilter,
    statusFilter,
    setStatusFilter,
    ...tasksData,
    hasDeclinedPayment,
    dueCount: dueTasks.length,
    handleLoadMore,
    scheduledCount: scheduledTasks.length,
    hasNextPage,
    tasksInbox: tasksTo,
    loadedTasks: tasks.length,
    dueTasks,
    setSearchTerm: onSearch,
    totalNumber: tasks?.length ?? 0,
  };
};
