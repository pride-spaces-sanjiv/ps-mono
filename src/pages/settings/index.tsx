import SettingsProfile from "./profile";

const SettingsPage = () => {
  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">View your account details.</p>
      </div>
      <SettingsProfile />
    </div>
  );
};

export default SettingsPage;
