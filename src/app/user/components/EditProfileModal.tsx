import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import imageCompression from "browser-image-compression";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Camera, Loader2, User as UserIcon } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { checkUsernameExists, uploadProfileImage } from "@/auth/userService";
import { toast } from "sonner";
import { useLanguage } from "@/shared/contexts/LanguageContext";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Only alphanumeric and underscores allowed")
    .optional()
    .or(z.literal("")),
  whatsapp: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit number")
    .optional()
    .or(z.literal("")),
  bio: z.string().max(200, "Bio cannot exceed 200 characters").optional().or(z.literal("")),
  state: z.string().max(50).optional().or(z.literal("")),
  district: z.string().max(50).optional().or(z.literal("")),
  city: z.string().max(50).optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { userProfile, user, updateUserProfileData } = useAuth();
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      whatsapp: "",
      bio: "",
      state: "",
      district: "",
      city: "",
    },
  });

  // Pre-fill form when modal opens
  useEffect(() => {
    if (open && userProfile) {
      form.reset({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        username: userProfile.username || "",
        whatsapp: userProfile.whatsapp || "",
        bio: userProfile.bio || "",
        state: userProfile.state || "",
        district: userProfile.district || "",
        city: userProfile.city || "",
      });
      setPreviewUrl(userProfile.profileImage || null);
      setSelectedFile(null);
    }
  }, [open, userProfile, form]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !userProfile) return;

    try {
      setIsUploading(true);

      // 1. Username uniqueness check
      if (data.username && data.username !== userProfile.username) {
        const exists = await checkUsernameExists(data.username, user.uid);
        if (exists) {
          form.setError("username", { message: "This username is already taken" });
          setIsUploading(false);
          return;
        }
      }

      // 2. Handle Image Upload if a new file was selected
      let newProfileImageUrl = userProfile.profileImage;
      if (selectedFile) {
        // Compress image before upload
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
          fileType: "image/webp" as string,
        };
        const compressedFile = await imageCompression(selectedFile, options);
        newProfileImageUrl = await uploadProfileImage(compressedFile, user.uid);
      }

      // 3. Update Firestore
      await updateUserProfileData({
        ...data,
        displayName: `${data.firstName.trim()} ${data.lastName.trim()}`,
        profileImage: newProfileImageUrl,
      });

      toast.success("Profile updated successfully!");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const isDirty = form.formState.isDirty || selectedFile !== null;

  const handleClose = (newOpen: boolean) => {
    if (!newOpen && isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(newOpen);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-full sm:side-right sm:w-[450px] flex flex-col p-0 rounded-t-2xl sm:rounded-none">
        <SheetHeader className="p-6 pb-4 border-b border-gray-100 text-left">
          <SheetTitle className="font-serif text-[#0f3c6e] text-2xl">Edit Profile</SheetTitle>
          <SheetDescription>
            Update your personal details and how you appear to the community.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative group cursor-pointer">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center relative">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-gray-400" />
                  )}
                  
                  {/* Overlay */}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">Tap image to change photo<br/>(Max 5MB)</p>
            </div>

            {/* Restricted Field: Mobile (Login ID) */}
            <div className="space-y-2">
              <Label className="text-gray-500">Primary Mobile (Login ID)</Label>
              <Input
                disabled
                value={userProfile?.mobile || ""}
                className="bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-400">Used for login. Cannot be changed here.</p>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                  placeholder="First Name"
                  disabled={isUploading}
                />
                {form.formState.errors.firstName && (
                  <p className="text-xs text-red-500">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                  placeholder="Last Name"
                  disabled={isUploading}
                />
                {form.formState.errors.lastName && (
                  <p className="text-xs text-red-500">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...form.register("username")}
                placeholder="e.g. aditya_v"
                disabled={isUploading}
              />
              {form.formState.errors.username && (
                <p className="text-xs text-red-500">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                {...form.register("whatsapp")}
                placeholder="10-digit number"
                disabled={isUploading}
              />
              {form.formState.errors.whatsapp && (
                <p className="text-xs text-red-500">{form.formState.errors.whatsapp.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio / About</Label>
              <Textarea
                id="bio"
                {...form.register("bio")}
                placeholder="Tell the community a bit about yourself..."
                className="resize-none"
                rows={3}
                disabled={isUploading}
              />
              <div className="flex justify-between items-center">
                {form.formState.errors.bio ? (
                  <p className="text-xs text-red-500">{form.formState.errors.bio.message}</p>
                ) : <span />}
                <p className="text-xs text-gray-400">{(form.watch("bio") || "").length}/200</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-[#0f3c6e]">Location Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input {...form.register("city")} placeholder="City / Village" disabled={isUploading} />
                <Input {...form.register("district")} placeholder="District" disabled={isUploading} />
                <Input {...form.register("state")} placeholder="State" className="col-span-2" disabled={isUploading} />
              </div>
            </div>

          </form>
        </div>

        <SheetFooter className="p-6 border-t border-gray-100 bg-white">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isUploading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="profile-form"
            disabled={isUploading || !isDirty}
            className="w-full sm:w-auto bg-[#0f3c6e] hover:bg-[#1e5aa0] text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
