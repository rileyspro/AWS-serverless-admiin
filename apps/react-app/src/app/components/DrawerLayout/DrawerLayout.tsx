import { LOGO_LARGE_ADMIIN, LOGO_ICON_ADMIIN } from '@admiin-com/ds-common';
import { styled } from '@mui/system';
import { Auth } from 'aws-amplify';
import React, { Suspense, useEffect, useMemo } from 'react';
import { gql, useApolloClient, useLazyQuery, useQuery } from '@apollo/client';
import { Outlet, useNavigate } from 'react-router-dom';
import { CSIsLoggedIn as IS_LOGGED_IN } from '@admiin-com/ds-graphql';
import { getUser as GET_USER } from '@admiin-com/ds-graphql';
import { PATHS } from '../../navigation/paths';
import { useNotificationService } from '../../hooks/useNotificationService/useNotificationService';
import { SidebarLayout } from '../SidebarLayout/SidebarLayout';
import { DRAWER_WIDTH } from '../../constants/config';
//import { styled } from '@mui/material';
// Styled component for the root container (App)
//const AppContainer = styled('div')(({ theme }) => ({
//  height: 'calc(var(--vh, 1vh) * 100)',
// display: 'flex',
// justifyContent: 'center',
// alignItems: 'center',
// backgroundColor: theme.palette.background.default,
//}));

// Styled component for the content that adjusts for the safe area insets
//const SafeContent = styled('div')(() => ({
//  padding: 'env(safe-area-inset-top) 0px env(safe-area-inset-bottom)',
//  margin: 'env(safe-area-inset-left) 0 env(safe-area-inset-right)',
//  paddingBottom: 'env(safe-area-inset-top)',
//}));
export const DrawerLayout = () => {
  const navigate = useNavigate();
  const client = useApolloClient();
  const [getUser] = useLazyQuery(gql(GET_USER));

  const { data: loggedInData } = useQuery(gql(IS_LOGGED_IN));
  const isLoggedIn = useMemo(() => loggedInData?.isLoggedIn, [loggedInData]);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const curUser = await Auth.currentAuthenticatedUser({
          bypassCache: true,
        });
        if (curUser?.attributes?.sub) {
          localStorage.setItem('sub', curUser.attributes.sub as string);

          await getUser({
            variables: {
              id: curUser.attributes.sub,
            },
          });
        }
      } catch (err) {
        console.log('ERROR: Auth.currentAuthenticatedUser', err);
      }

      if (isLoggedIn === false) {
        navigate(PATHS.signIn, { replace: true });
      }
    };

    checkUserSession();
  }, [client, getUser, isLoggedIn, navigate]);

  useNotificationService();

  const drawerWidth = DRAWER_WIDTH;

  return (
    //<AppContainer>
    //<SafeContent>
    <SidebarLayout
      drawerWidth={drawerWidth}
      logoFullSrc={LOGO_LARGE_ADMIIN}
      logoIconSrc={LOGO_ICON_ADMIIN}
    >
      <Suspense fallback={<div />}>
        <Outlet />
      </Suspense>
    </SidebarLayout>
    /*</SafeContent>*/
    //</AppContainer>
  );
};
