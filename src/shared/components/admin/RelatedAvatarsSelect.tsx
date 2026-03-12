import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { AVATAR_SAMBANDH_CONFIG } from "@/shared/utils/sthanTypes";
import { RelatedAvatar } from "@/types";
import { ChevronRight } from "lucide-react";

interface RelatedAvatarsSelectProps {
    value: RelatedAvatar[];
    onChange: (value: RelatedAvatar[]) => void;
    excludeAvatarId?: string;
}

export function RelatedAvatarsSelect({ value, onChange, excludeAvatarId }: RelatedAvatarsSelectProps) {
    const handleAvatarToggle = (avatarId: string, checked: boolean) => {
        if (checked) {
            // Add avatar with no subtypes initially
            onChange([...value, { avatar: avatarId, subtype: [] }]);
        } else {
            // Remove avatar
            onChange(value.filter(a => a.avatar !== avatarId));
        }
    };

    const handleSubtypeToggle = (avatarId: string, subtypeId: string, checked: boolean) => {
        const updated = value.map(item => {
            if (item.avatar === avatarId) {
                const newSubtypes = checked
                    ? [...item.subtype, subtypeId]
                    : item.subtype.filter(s => s !== subtypeId);
                return { ...item, subtype: newSubtypes };
            }
            return item;
        });
        onChange(updated);
    };

    return (
        <div className="space-y-4 border border-slate-100 bg-white/50 p-4 rounded-2xl">
            <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Related Avatars <span className="text-[12px] lowercase font-medium text-slate-400 tracking-normal ml-1">(Optional)</span>
            </Label>

            <div className="grid grid-cols-1 gap-4">
                {AVATAR_SAMBANDH_CONFIG.filter(a => a.id !== excludeAvatarId).map((avatar) => {
                    const isSelected = value.some(v => v.avatar === avatar.id);
                    const selectedData = value.find(v => v.avatar === avatar.id);

                    return (
                        <div key={avatar.id} className="space-y-2">
                            <div className="flex items-center space-x-3 group">
                                <Checkbox
                                    id={`avatar-${avatar.id}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => handleAvatarToggle(avatar.id, checked === true)}
                                    className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-all"
                                />
                                <Label
                                    htmlFor={`avatar-${avatar.id}`}
                                    className={`text-sm font-bold cursor-pointer transition-colors ${isSelected ? 'text-blue-900' : 'text-slate-600 group-hover:text-slate-900'}`}
                                >
                                    {avatar.label}
                                </Label>
                            </div>

                            {isSelected && avatar.subdivisions.length > 0 && (
                                <div className="ml-8 space-y-2 border-l-2 border-slate-100 pl-4 animate-in fade-in slide-in-from-left-2 duration-200">
                                    {avatar.subdivisions.filter(s => s.id !== 'complete').map((sub) => (
                                        <div key={sub.id} className="flex items-center space-x-3 group/sub">
                                            <div className="text-slate-300">
                                                <ChevronRight className="w-3 h-3" />
                                            </div>
                                            <Checkbox
                                                id={`sub-${avatar.id}-${sub.id}`}
                                                checked={selectedData?.subtype.includes(sub.id) || false}
                                                onCheckedChange={(checked) => handleSubtypeToggle(avatar.id, sub.id, checked === true)}
                                                className="w-3.5 h-3.5 border-slate-200 data-[state=checked]:bg-slate-700 data-[state=checked]:border-slate-700"
                                            />
                                            <Label
                                                htmlFor={`sub-${avatar.id}-${sub.id}`}
                                                className={`text-[13px] font-medium cursor-pointer transition-colors ${selectedData?.subtype.includes(sub.id) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-800'}`}
                                            >
                                                {sub.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
