import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { CampusFeedView } from '../components/CampusFeedView';
import { MarketplaceView } from '../components/MarketplaceView';
import { CampusHubsView } from '../components/CampusHubsView';
import { UserProfileView } from '../components/UserProfileView';
import { StudentDashboard } from '../components/StudentDashboard';
import { ArticleEditorScreen } from '../mobile/screens/ArticleEditorScreen';
import { ArticleDetailScreen } from '../mobile/screens/ArticleDetailScreen';
import { MyArticlesScreen } from '../mobile/screens/MyArticlesScreen';
import { BecomeWriterScreen } from '../mobile/screens/BecomeWriterScreen';
import { LibraryView } from '../components/LibraryView';
import { checkIsApprovedWriter } from '../services/writers';
import { useAuth } from '../context/AuthContext';

const GatedWriteRoute: React.FC = () => {
  const { currentUser } = useAuth();
  const [isApproved, setIsApproved] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (currentUser?.id) {
      checkIsApprovedWriter(currentUser.id).then(setIsApproved);
    } else {
      setIsApproved(false);
    }
  }, [currentUser?.id]);

  if (isApproved === null) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isApproved) {
    return (
      <BecomeWriterScreen
        onBack={() => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = '/feed';
          }
        }}
        onApprovedContinue={() => setIsApproved(true)}
      />
    );
  }

  return (
    <ArticleEditorScreen
      onBack={() => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = '/feed';
        }
      }}
    />
  );
};

const ProfileRouteWrapper: React.FC<{
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenCreateBusiness: () => void;
}> = ({ onOpenAuth, onOpenCreateBusiness }) => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  if (id === 'me' || (currentUser && id === currentUser.id)) {
    return (
      <StudentDashboard
        businesses={[]}
        onOpenAuth={onOpenAuth}
        onOpenCreateBusiness={onOpenCreateBusiness}
        onSelectBusiness={() => {}}
      />
    );
  }

  return <UserProfileView user={null} />;
};

export const AppRoutes: React.FC<{
  onOpenAuth: (mode?: 'signin' | 'signup' | 'unilorin-otp') => void;
  onOpenCreateBusiness: () => void;
  onOpenSnapViewer: () => void;
  onOpenCreateSnap: () => void;
}> = ({
  onOpenAuth,
  onOpenCreateBusiness,
  onOpenSnapViewer,
  onOpenCreateSnap,
}) => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route
        path="/feed"
        element={
          <CampusFeedView
            posts={[]}
            snaps={[]}
            businesses={[]}
            selectedLevel="All"
            onLikeToggle={() => {}}
            onAddComment={() => {}}
            onSelectSnap={onOpenSnapViewer}
            onOpenCreateSnap={onOpenCreateSnap}
            onOpenCreatePost={() => {}}
            onSelectBusiness={() => {}}
            onNavigateModule={() => {}}
          />
        }
      />
      <Route
        path="/market"
        element={
          <MarketplaceView
            businesses={[]}
            searchQuery=""
            onSearchChange={() => {}}
            selectedCampus="All"
            onSelectCampus={() => {}}
            onSelectBusiness={() => {}}
            onOpenCreateBusiness={onOpenCreateBusiness}
            onOpenAuth={onOpenAuth}
          />
        }
      />
      <Route
        path="/hubs"
        element={
          <CampusHubsView
            onSelectHubZone={() => {}}
            onOpenCreateBusiness={onOpenCreateBusiness}
          />
        }
      />
      <Route path="/chats" element={<Navigate to="/feed" replace />} />
      <Route
        path="/profile/:id"
        element={
          <ProfileRouteWrapper
            onOpenAuth={onOpenAuth}
            onOpenCreateBusiness={onOpenCreateBusiness}
          />
        }
      />
      <Route path="/library" element={<LibraryView onBack={() => window.history.back()} />} />
      <Route path="/write" element={<GatedWriteRoute />} />
      <Route path="/write/:id" element={<GatedWriteRoute />} />
      <Route path="/article/:id" element={<ArticleDetailScreen />} />
      <Route path="/my-articles" element={<MyArticlesScreen />} />
      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  );
};

export default AppRoutes;
