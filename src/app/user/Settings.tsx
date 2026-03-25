import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import { Bell, Globe, Map, Moon, ChevronLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { useToast } from "@/shared/hooks/use-toast";

const Settings = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState({
    enabled: true,
    festivals: true,
    newTemples: true,
    updates: false,
  });

  const [mapSettings, setMapSettings] = useState({
    showNames: true,
    autoCenter: true,
  });

  const handleSave = () => {
    toast({
      title: t("settings.savedSuccess"),
      description: t("settings.savedSuccessDesc"),
    });
  };

  return (
    <div className="min-h-full flex-1 bg-background ">
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between bg-background/95 /95 backdrop-blur-sm border-b border-gray-100">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2 hover:bg-black/5"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-7 h-7 text-[#0f3c6e]" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#0f3c6e] font-serif">
          {t("settings.title")}
        </h1>
        <div className="w-10" />
      </div>

      <div className="max-w-3xl mx-auto p-8 pt-4">
        <div className="space-y-6">
          {/* Language Settings */}
          <div className="bg-card p-6 rounded-xl border border-border">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {t("settings.language")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.languageDesc")}
                  </p>
                </div>
                <Select
                  value={language}
                  onValueChange={(value: any) => setLanguage(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marathi">
                      {t("common.marathi")} (Marathi)
                    </SelectItem>
                    <SelectItem value="hindi">
                      {t("common.hindi")} (Hindi)
                    </SelectItem>
                    <SelectItem value="english">
                      {t("common.english")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-card p-6 rounded-xl border border-border">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {t("settings.notifications")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.notificationsDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={notifications.enabled}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, enabled: checked })
                    }
                  />
                </div>
                <div className="space-y-3 pl-0">
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm cursor-pointer">
                      {t("settings.templeFestivals")}
                    </Label>
                    <Switch
                      checked={notifications.festivals}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          festivals: checked,
                        })
                      }
                      disabled={!notifications.enabled}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm cursor-pointer">
                      {t("settings.newTemplesAdded")}
                    </Label>
                    <Switch
                      checked={notifications.newTemples}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          newTemples: checked,
                        })
                      }
                      disabled={!notifications.enabled}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm cursor-pointer">
                      {t("settings.updatesAnnouncements")}
                    </Label>
                    <Switch
                      checked={notifications.updates}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, updates: checked })
                      }
                      disabled={!notifications.enabled}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Settings */}
          <div className="bg-card p-6 rounded-xl border border-border">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Map className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  {t("settings.mapPreferences")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("settings.mapPreferencesDesc")}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm cursor-pointer">
                      {t("settings.showTempleNames")}
                    </Label>
                    <Switch
                      checked={mapSettings.showNames}
                      onCheckedChange={(checked) =>
                        setMapSettings({ ...mapSettings, showNames: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm cursor-pointer">
                      {t("settings.autoCenterLocation")}
                    </Label>
                    <Switch
                      checked={mapSettings.autoCenter}
                      onCheckedChange={(checked) =>
                        setMapSettings({ ...mapSettings, autoCenter: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="bg-card p-6 rounded-xl border border-border">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Moon className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {t("settings.darkMode")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.darkModeDesc")}
                    </p>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline">{t("common.cancel")}</Button>
            <Button
              className="bg-accent hover:bg-accent/90"
              onClick={handleSave}
            >
              {t("settings.saveChanges")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
