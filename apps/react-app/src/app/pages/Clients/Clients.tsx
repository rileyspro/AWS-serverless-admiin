import { gql, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useMemo } from 'react';
import {
  Contact,
  CSGetSub as GET_SUB,
  OnboardingStatus,
} from '@admiin-com/ds-graphql';
import { getUser as GET_USER } from '@admiin-com/ds-graphql';
import { getOnboardingPath } from '../../helpers/onboarding';
import { useMediaQuery, useTheme } from '@mui/material';
import MainLayout, {
  MainLayoutGridType,
} from '../../components/MainLayout/MainLayout';
import ClientsMainPage from '../../components/ClientsMainPage/ClientsMainPage';
import ClientDetail from '../ClientDetail/ClientDetail';
import { API } from 'aws-amplify';
import { useClientContext } from '../../components/ApolloClientProvider/ApolloClientProvider';

const Clients = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDownLg = useMediaQuery(theme.breakpoints.down('lg'));
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

  const { output } = useClientContext();
  useEffect(() => {
    const updateIdentityId = async () => {
      try {
        await API.post(output?.restApiName, '/identity-id', {
          body: {},
        });
      } catch (e) {
        console.log('POST call failed: ', e);
      }
    };

    if (!user?.identityId && output?.restApiName) {
      updateIdentityId();
    }
  }, [user?.identityId, output?.restApiName]);

  const [isCreateFormView, setCreateFormView] = React.useState<boolean>(false);

  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(
    null
  );

  const handleCreateForm = () => {
    setSelectedContact(null);
    setCreateFormView(true);
  };
  const handleContactCreated = (contact: Contact | null) => {
    // setSelectedContact(contact);
    if (!contact) setSelectedContact(null);
  };

  let gridType = 'All';
  if ((isCreateFormView || selectedContact) && isDownLg) gridType = 'Right';
  else if (isDownLg && !isCreateFormView && !selectedContact) gridType = 'Left';

  return (
    <MainLayout
      onBackToLeft={() => {
        setSelectedContact(null);
        setCreateFormView(false);
      }}
      background="linear-gradient(to bottom, rgba(140, 81, 255, 0.7) 0%, transparent 25%)"
      gridType={gridType as MainLayoutGridType}
      toolbarComponent={
        <ClientsMainPage
          handleSelected={setSelectedContact}
          handleCreateNew={handleCreateForm}
          selectedContact={selectedContact}
        />
      }
    >
      <ClientDetail
        key={selectedContact?.id}
        contact={selectedContact}
        onCreated={handleContactCreated}
      />
    </MainLayout>
  );
};

export default Clients;
