import WebApp from '@twa-dev/sdk';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { useEffect, useMemo } from 'react';
import {
  Navigate,
  Route,
  BrowserRouter,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {BottomNavBar } from '@/components/BottomNavBar';

import { routes } from '@/navigation/routes.jsx';

function BackButtonManipulator() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    function onClick() {
      navigate(-1);
    }
    WebApp.BackButton.onClick(onClick);

    return () => WebApp.BackButton.offClick(onClick);
  }, [navigate]);

  useEffect(() => {
    if (location.pathname === '/') {
      WebApp.BackButton.isVisible && WebApp.BackButton.hide();
    } else {
      !WebApp.BackButton.isVisible && WebApp.BackButton.show();
    }
  }, [location]);

  return null;
}
function NavigationHandler() {
  const location = useLocation();
  
  // Hide BottomNavBar on login screen (root path)
  if (location.pathname === '/') {
    return null;
  }
  
  return <BottomNavBar />;
}

/**
 * @return {JSX.Element}
 */
export function App() {
  // Determine the basename based on the current URL
  const basename = useMemo(() => {
    const url = window.location.pathname;
    // Check if we're in the production environment
    if (url.includes('/battle_royale_client/')) {
      return '/battle_royale_client';
    }
    // Default to development
    return '/miniapp';
  }, []);

  return (
    <AppRoot
      appearance={WebApp.colorScheme}
      platform={['macos', 'ios'].includes(WebApp.platform) ? 'ios' : 'base'}
    >
      <BrowserRouter basename={basename}>
        <BackButtonManipulator/>
        <Routes>
          {routes.map((route) => <Route key={route.path} {...route} />)}
          <Route path='*' element={<Navigate to='/'/>}/>
        </Routes>
        {/* <NavigationHandler /> */}
      </BrowserRouter>
    </AppRoot>
  );
}
