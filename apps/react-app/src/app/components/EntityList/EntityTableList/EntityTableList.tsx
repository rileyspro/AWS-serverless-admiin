import * as React from 'react';
import Paper from '@mui/material/Paper';
import {
  WBTable,
  WBTableBody,
  WBTableCell,
  WBTableContainer,
  WBTableHead,
  WBTableRow,
} from '@admiin-com/ds-web';
import { useTranslation } from 'react-i18next';
import { EntityTableListItem } from './EntityTableListItem';
import { CurrencyNumber } from '../../CurrencyNumber/CurrencyNumber';
import { DashboardData } from '../../../hooks/useUpcomingPayments/useUpcomingPayments';

interface EntityTableList {
  dashboardData?: DashboardData;
  loading: boolean;
}

export function EntityTableList({ dashboardData, loading }: EntityTableList) {
  const { t } = useTranslation();

  return (
    <WBTableContainer component={Paper} sx={{ overflowX: 'auto' }}>
      <WBTable aria-label="simple table">
        <WBTableHead>
          <WBTableRow>
            <WBTableCell sx={{ fontWeight: 'fontWeightBold' }}>
              {t('entity', { ns: 'dashboard' })}
            </WBTableCell>
            <WBTableCell align="right" sx={{ fontWeight: 'fontWeightBold' }}>
              {t('inbox', { ns: 'dashboard' })}
            </WBTableCell>
            <WBTableCell align="right">
              {t('amount', { ns: 'dashboard' })}
            </WBTableCell>
            <WBTableCell />
            <WBTableCell
              align="right"
              sx={{
                fontWeight: 'fontWeightBold',
                pl: 4, // Add left padding to the first cell after the gap
                //borderLeft: '40px solid #FFF', // Border to simulate gap
              }}
            >
              {t('sent', { ns: 'dashboard' })}
            </WBTableCell>
            <WBTableCell align="right">
              {t('amount', { ns: 'dashboard' })}
            </WBTableCell>
          </WBTableRow>
        </WBTableHead>
        {dashboardData && (
          <WBTableBody sx={{ '& .MuiTableCell-root': { border: 0 } }}>
            {dashboardData.entities.map((entity) => (
              <EntityTableListItem entity={entity} key={entity.entity.id} />
            ))}
            <WBTableRow
              sx={{
                borderTop: 'solid 2px #e5e5e5',
              }}
            >
              <WBTableCell
                colSpan={0}
                sx={(theme) => ({ ...theme.typography.h3 })}
              >
                {t('total', { ns: 'dashboard' })}
              </WBTableCell>
              <WBTableCell
                align="right"
                colSpan={2}
                sx={{ fontWeight: 'fontWeightBold' }}
              >
                <CurrencyNumber
                  number={dashboardData.inboxAmount ?? 0}
                  sup={false}
                  textAlign={'right'}
                />
              </WBTableCell>
              <WBTableCell />
              <WBTableCell
                align="right"
                colSpan={2}
                sx={{ fontWeight: 'fontWeightBold' }}
              >
                <CurrencyNumber
                  number={dashboardData.outboxAmount ?? 0}
                  sup={false}
                  textAlign={'right'}
                />
              </WBTableCell>
            </WBTableRow>
          </WBTableBody>
        )}
      </WBTable>
    </WBTableContainer>
  );
}
