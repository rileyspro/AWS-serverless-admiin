import { gql, useQuery } from '@apollo/client';
import { WBMenu, WBMenuItem, WBTextField, WBToolbar } from '@admiin-com/ds-web';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useMemo } from 'react';
import {
  Contact,
  ContactType,
  Entity,
  EntityClientsStatus,
  CSGetSub as GET_SUB,
  OnboardingStatus,
} from '@admiin-com/ds-graphql';
import { getUser as GET_USER } from '@admiin-com/ds-graphql';
import { getOnboardingPath } from '../../helpers/onboarding';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { ContactsList } from '../ContactsList/ContactsList';
import { useDebounce } from '@admiin-com/ds-hooks';
import ToolbarLayout from '../ToolbarLayout/ToolbarLayout';
import { BulkImport } from '../../pages/BulkImport/BulkImport';
import { useSelectedEntity } from '../../hooks/useSelectedEntity/useSelectedEntity';
import { useClients } from '../../hooks/useClients/useClients';

/* eslint-disable-next-line */
export interface ClientsMainPageProps {
  handleCreateNew: () => void;
  selectedContact: null | Contact;
  handleSelected: (contact: null | Contact) => void;
}

export function ClientsMainPage({
  handleCreateNew,
  selectedContact,
  handleSelected,
}: ClientsMainPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { data: subData } = useQuery(gql(GET_SUB));
  const { data: userData } = useQuery(gql(GET_USER), {
    variables: {
      id: subData?.sub,
    },
    skip: !subData?.sub,
  });
  const user = useMemo(() => userData?.getUser || {}, [userData]);

  useEffect(() => {
    if (user?.id && user.onboardingStatus !== OnboardingStatus.COMPLETED) {
      navigate(getOnboardingPath(user), { replace: true });
    }
  }, [user, navigate]);

  const handleNewContact = () => {
    handleCreateNew();
    handleMenuClose();
  };
  const [searchName, setSearchName] = React.useState<string>('');

  const debouncedSearchName = useDebounce(searchName.toLocaleLowerCase(), 100);

  const onSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchName(event.target.value);
  };

  const filterdContacts: (Contact & { userId: string; entity: Entity })[] = [];
  const {
    users: clients,
    loading,
    handleLoadMore,
    hasNextPage,
  } = useClients({ searchName: debouncedSearchName });
  if (clients)
    for (const client of clients) {
      if (client.entity)
        filterdContacts.push({
          __typename: 'Contact',
          contactType: ContactType.CLIENT,
          id: client?.entity?.id,
          userId: client?.userId,
          entityId: client?.entity?.id,
          firstName: client?.entity?.contact?.firstName || '',
          phone: client?.entity?.contact?.phone || '',
          lastName: client?.entity?.contact?.lastName || '',
          email: client?.entity?.contact?.email || '',
          companyName: client?.entity?.name,
          entity: client?.entity,
        });
    }

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const [modalOpen, setModalOpen] = React.useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
  };
  const { entity } = useSelectedEntity();

  return (
    <>
      <ToolbarLayout
        title={t('clientsTitle', { ns: 'common' })}
        onAddClick={(e) => handleOpenMenu(e)}
      >
        <WBToolbar sx={{ mt: 4.5 }}>
          <WBTextField
            variant="outlined"
            leftIcon={'Search'}
            placeholder="Search"
            value={searchName}
            onChange={onSearch}
            InputProps={{
              sx: {
                ...theme.typography.body2,
                fontWeight: 'bold',
                color: theme.palette.common.white,
              },
            }}
            fullWidth
          />
        </WBToolbar>
        <WBMenu
          id="customized-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          MenuListProps={{
            'aria-labelledby': 'basic-button',
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <WBMenuItem
            onClick={handleNewContact}
            sx={{ ...theme.typography.body2, fontWeight: 'bold' }}
          >
            {t('addNewClient', { ns: 'contacts' })}
          </WBMenuItem>

          <WBMenuItem
            onClick={() => {
              handleMenuClose();
              handleOpenModal();
            }}
            disabled={entity?.clientsStatus !== EntityClientsStatus.ENABLED}
            sx={{ ...theme.typography.body2, fontWeight: 'bold' }}
          >
            {t('bulkImport', { ns: 'contacts' })}
          </WBMenuItem>
        </WBMenu>
        <BulkImport
          open={modalOpen}
          handleCloseModal={handleCloseModal}
        ></BulkImport>
      </ToolbarLayout>

      <ContactsList
        loading={loading}
        selected={selectedContact}
        handleLoadMore={handleLoadMore}
        contacts={filterdContacts}
        query={debouncedSearchName}
        onClick={handleSelected}
        onAddClick={() => handleNewContact()}
        hasNextPage={hasNextPage}
        isClient={true}
      />
    </>
  );
}

export default ClientsMainPage;
