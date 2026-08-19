import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import PostView from './pages/PostView';
import Archive from './pages/Archive';
import TagList from './pages/TagList';
import NotFound from './pages/NotFound';
// Admin is only reachable in dev. In the production build the route is
// omitted entirely so visitors on github.io never see the editor / settings.
import Admin from './pages/admin/Admin';

const isAdminEnabled = import.meta.env.DEV;

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/posts/:slug" element={<PostView />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/tags" element={<TagList />} />
          <Route path="/tags/:tag" element={<TagList />} />
          {isAdminEnabled ? <Route path="/admin" element={<Admin />} /> : null}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
