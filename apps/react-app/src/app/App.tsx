import {
  ThemeOptions,
  WBDesignSystemProvider,
  WBSnackbarProvider,
} from '@admiin-com/ds-web';
import { MIXPANEL_TOKEN_DEV, SENTRY_DSN } from '@admiin-com/ds-common';
import { darkTheme, theme } from '@admiin-com/ds-design-token';
import mixpanel from 'mixpanel-browser';
import { deepmerge } from 'deepmerge-ts';
import { LinkBehavior } from './components';
import HubListener from './components/HubListener/HubListener';
import { NavRoutes } from './navigation/NavRoutes';
import * as Sentry from '@sentry/react';
import './i18n';
import React from 'react';
const { VITE_ENV } = import.meta.env;

const commonTheme = {
  components: {
    MuiLink: {
      defaultProps: {
        component: LinkBehavior,
      },
    },
  },
};

// TODO: (EDIT: I think fixed?) throwing ts error although behaviour working for component: LinkBehaviour for MuiLink
const appTheme: ThemeOptions = deepmerge(theme, commonTheme);
const appDarkTheme: ThemeOptions = deepmerge(darkTheme, commonTheme);
Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
  enabled: false, //TODO: enable for production
});

export function App() {
  mixpanel.init(MIXPANEL_TOKEN_DEV, {
    debug: VITE_ENV !== 'prod',
    ignore_dnt: true,
  });
  // React.useEffect(() => {
  //   const setViewportHeight = () => {
  //     const vh = window.innerHeight * 0.01;
  //     document.documentElement.style.setProperty('--vh', `${vh}px`);
  //   };

  //   // Set viewport height initially and on resize
  //   setViewportHeight();
  //   window.addEventListener('resize', setViewportHeight);
  //   window.addEventListener('orientationchange', setViewportHeight);

  //   return () => {
  //     window.removeEventListener('resize', setViewportHeight);
  //     window.removeEventListener('orientationchange', setViewportHeight);
  //   };
  // }, []);

  return (
    <>
      <HubListener />
      <WBDesignSystemProvider theme={appTheme} darkTheme={appDarkTheme}>
        <WBSnackbarProvider>
          <NavRoutes />
        </WBSnackbarProvider>
      </WBDesignSystemProvider>
    </>
  );
}

export default App;
