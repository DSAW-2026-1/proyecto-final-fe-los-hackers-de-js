import { useLocation } from 'react-router';
import { useLayoutEffect } from "react";

//Taken from https://medium.com/@caden0002/fixing-scroll-position-issues-in-react-router-scroll-to-top-on-navigation-86bcfbdfc9db
//TODO: You can still see like a frame of the change which is awful, is it even possible to do better?
export function ScrollToTop({ children }) {
    const location = useLocation();

    useLayoutEffect(() => {
      // Scroll to the top of the page when the route changes
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [location.pathname]);

    return children;
}
