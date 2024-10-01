import { gql, useMutation } from '@apollo/client';
import {
  Task,
  tasksByEntityTo,
  updateTask as UPDATE_TASK,
} from '@admiin-com/ds-graphql';
import { UseMutationTuple } from '../useCreateContact/useCreateContact';
export const useUpdateTask = (
  task: Task | null
): [UseMutationTuple[0], { error: UseMutationTuple[1]['error'] }] => {
  const [updateTask, data] = useMutation(gql(UPDATE_TASK), {
    refetchQueries: [
      ...(task?.entityId
        ? [
            {
              query: gql(tasksByEntityTo),
              variables: {
                entityId: task?.entityId,
                limit: 20,
                status: 'INCOMPLETE',
              },
            },
            {
              query: gql(tasksByEntityTo),
              variables: {
                entityId: task?.entityId,
                limit: 20,
                status: 'COMPLETED',
              },
            },
          ]
        : []),
    ],
    awaitRefetchQueries: true,
  });

  return [updateTask, { error: data.error }];
};
