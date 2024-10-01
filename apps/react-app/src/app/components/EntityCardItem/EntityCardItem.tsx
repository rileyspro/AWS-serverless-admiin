import * as React from 'react';
import {
  WBBox,
  WBCard,
  WBCardContent,
  WBGrid,
  WBTypography,
} from '@admiin-com/ds-web';
import { Skeleton } from '@mui/material';
import { WBS3Avatar } from '@admiin-com/ds-amplify-web';
import { TaskDirection } from '@admiin-com/ds-graphql';
import { EntityCardTasks } from './EntityCardTasks';
import { EntityTaskData } from '../../hooks/useUpcomingPayments/useUpcomingPayments';
import { useGotoTaskBox } from '../../hooks/useSelectedEntity/useSelectedEntity';

interface EntityCardListItemProps {
  entity?: EntityTaskData;
}
export function EntityCardItem({
  entity: entityTaskData,
}: EntityCardListItemProps) {
  const gotoTaskBox = useGotoTaskBox();
  const entity = entityTaskData?.entity;
  return (
    <WBCard sx={{ height: '100%' }}>
      <WBCardContent
        sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <WBBox
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          flexGrow={1}
        >
          <WBBox
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => {
              if (entity?.id) gotoTaskBox(entity?.id);
            }}
          >
            {entity ? (
              <WBS3Avatar
                imgKey={entity.logo?.key}
                identityId={entity.logo?.identityId}
                level={entity.logo?.level}
                companyName={entity.name}
              />
            ) : (
              <Skeleton variant="circular" width={40} height={40} />
            )}
            <WBTypography variant="h4" mb={0} ml={2}>
              {entity ? entity.name : <Skeleton width={80}></Skeleton>}
            </WBTypography>
          </WBBox>
        </WBBox>
        <WBGrid container spacing={3} mt={2}>
          <WBGrid md={6} xs={12} sx={{ cursor: 'pointer' }}>
            <EntityCardTasks
              entity={entityTaskData?.to}
              direction={TaskDirection.RECEIVING}
            />
          </WBGrid>
          <WBGrid md={6} xs={12} sx={{ cursor: 'pointer' }}>
            <EntityCardTasks
              entity={entityTaskData?.from}
              direction={TaskDirection.SENDING}
            />
          </WBGrid>
        </WBGrid>
      </WBCardContent>
    </WBCard>
  );
}
