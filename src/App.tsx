import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AmbientBackground } from "@/components/shared/AmbientBackground";
import { NavShell } from "@/components/shared/NavShell";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/hooks/useToast";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LandingPage } from "@/pages/LandingPage";
import { HomePage } from "@/pages/HomePage";
import { ChatPage } from "@/pages/ChatPage";
import { MoodPage } from "@/pages/MoodPage";
import { GroupPage } from "@/pages/GroupPage";
import { GroupRoomPage } from "@/pages/GroupRoomPage";
import { RoulettePage } from "@/pages/RoulettePage";
import { CookPage } from "@/pages/CookPage";
import { NearbyPage } from "@/pages/NearbyPage";
import { RestaurantDetailPage } from "@/pages/RestaurantDetailPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { SignupPage } from "@/pages/SignupPage";
import { LoginPage } from "@/pages/LoginPage";
import { OnboardingPage } from "@/pages/OnboardingPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AmbientBackground />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />

            <Route element={<NavShell />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/mood" element={<MoodPage />} />
              <Route path="/roulette" element={<RoulettePage />} />
              <Route path="/cook" element={<CookPage />} />
              <Route path="/nearby" element={<NearbyPage />} />
              <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
              <Route path="/group" element={<GroupPage />} />
              <Route path="/group/:roomId" element={<GroupRoomPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
