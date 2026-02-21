import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, User, CreditCard, TvMinimal, ListVideo } from "lucide-react";
import { userStore } from "@/services/store/user";
import { validateNumber } from "@/utils/number";
import CreditsBillingTab from "@/components/features/settings/Credits";
import SettingsProfile from "./profile";
import SettingsPlaylistInfo from "./playlist";
import SettingsGroups from "./groups";
import AdminPlaylistParse from "@/containers/admin-playlist-parse";
import ChannelsTab from "@/containers/channels-tab";

const adminRoutes = [
  "profile",
  "groups",
  "credits",
  "channels",
  "playlist-parse",
];
const userRoutes = ["profile", "playlist"];

const SettingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const userData = userStore((state) => state.value);
  const userLevel = useMemo(
    () => validateNumber(userData?.level, { invalidValue: 0 }),
    [userData?.level],
  );

  const validRoutes = useMemo(
    () => (userLevel >= 1 ? adminRoutes : userRoutes),
    [userData?.level],
  );

  const [path, setPath] = useState(
    () =>
      validRoutes.find(
        (rt) =>
          rt ===
          location.pathname
            .split("/")
            .filter((s) => s.trim())?.[1]
            ?.toLowerCase()
            .trim(),
      ) || "profile",
  );

  useEffect(() => {
    // console.log(location.pathname, path);
    if (!location.pathname.startsWith(`/settings/${path}`)) {
      navigate(`/settings/${path}`);
    }
  }, [path]);

  useEffect(() => {
    // console.log(location.pathname, path);
    if (!location.pathname.startsWith(`/settings/${path}`)) {
      setPath(
        validRoutes.find(
          (rt) =>
            rt ===
            location.pathname
              .split("/")
              .filter((s) => s.trim())?.[1]
              ?.toLowerCase()
              .trim(),
        ) || "profile",
      );
    }
  }, [location.pathname, validRoutes]);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings.</p>
      </div>
      <Tabs
        defaultValue="profile"
        orientation="horizontal"
        className="flex flex-row gap-6 max-lg:flex-col"
        value={path}
        onValueChange={(val) => {
          setPath(val);
        }}
      >
        <TabsList className="flex flex-col h-fit w-48 bg-muted p-1 max-lg:w-fit max-lg:max-w-full max-lg:flex-row max-lg:h-auto max-lg:mx-auto max-lg:px-2 max-lg:flex-wrap">
          <TabsTrigger
            value="profile"
            className="w-full justify-start gap-2 px-4 py-2"
          >
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          {userLevel === 0 && (
            <TabsTrigger
              value="playlist"
              className="w-full justify-start gap-2 px-4 py-2"
            >
              <ListVideo className="h-4 w-4" />
              Playlist
            </TabsTrigger>
          )}
          {userLevel >= 3 && (
            <TabsTrigger
              value="playlist-parse"
              className="w-full justify-start gap-2 px-4 py-2"
            >
              <ListVideo className="h-4 w-4" />
              Parse Playlist
            </TabsTrigger>
          )}
          {userLevel >= 1 && (
            <>
              <TabsTrigger
                value="groups"
                className="w-full justify-start gap-2 px-4 py-2"
              >
                <Users className="h-4 w-4" />
                Groups
              </TabsTrigger>
              <TabsTrigger
                value="credits"
                className="w-full justify-start gap-2 px-4 py-2"
              >
                <CreditCard className="h-4 w-4" />
                Credits
              </TabsTrigger>
            </>
          )}
          {userLevel >= 2 && (
            <TabsTrigger
              value="channels"
              className="w-full justify-start gap-2 px-4 py-2"
            >
              <TvMinimal className="h-4 w-4" />
              Channels
            </TabsTrigger>
          )}
        </TabsList>

        <div className="w-full">
          <SettingsProfile />
          {userLevel === 0 && <SettingsPlaylistInfo />}
          {userLevel >= 3 && (
            <TabsContent value="playlist-parse" className="mt-0 w-full">
              <AdminPlaylistParse />
            </TabsContent>
          )}
          {userLevel >= 1 && (
            <>
              <SettingsGroups />
              <CreditsBillingTab />
            </>
          )}
          {userLevel >= 2 && (
            <TabsContent value="channels" className="mt-0 w-full">
              <ChannelsTab />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
